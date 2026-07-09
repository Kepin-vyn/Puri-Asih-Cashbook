<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\UpdateReservationRequest;
use App\Http\Requests\Reservation\UpdateStatusRequest;
use App\Http\Resources\ReservationResource;
use App\Models\KasTransaction;
use App\Models\Reservation;
use App\Models\Shift;
use App\Services\ReservationService;
use App\Services\KasAutomationService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class ReservationController extends BaseApiController
{
    private ReservationService $reservationService;
    private ActivityLogService $activityLog;

    public function __construct(ReservationService $reservationService, ActivityLogService $activityLog)
    {
        $this->reservationService = $reservationService;
        $this->activityLog = $activityLog;
    }

    /**
     * GET /api/v1/reservations
     */
    public function index(Request $request): JsonResponse
    {
        $query = Reservation::with('user')->orderBy('created_at', 'desc');

        // Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('reservation_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('reservation_date', '<=', $request->date_to);
        }
        if ($request->filled('staff_id')) {
            $query->where('user_id', $request->staff_id);
        }

        // Summary (kalkulasi sebelum paginate)
        $totalRevenue       = (clone $query)->whereNotIn('status', ['cancel', 'noshow'])->sum('room_price');
        $totalReservations  = (clone $query)->count();

        $reservations = $query->paginate(20);

        return $this->successResponse(
            ReservationResource::collection($reservations->items()),
            'Data reservasi berhasil diambil.',
            200,
            [
                'summary' => [
                    'total_reservations'  => $totalReservations,
                    'total_revenue'       => (int) $totalRevenue,
                    'total_revenue_formatted' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
                ],
                'pagination' => [
                    'current_page' => $reservations->currentPage(),
                    'last_page'    => $reservations->lastPage(),
                    'per_page'     => $reservations->perPage(),
                    'total'        => $reservations->total(),
                ],
            ]
        );
    }

    /**
     * POST /api/v1/reservations
     */
    public function store(StoreReservationRequest $request): JsonResponse
    {
        $user = Auth::user();

        // Cek shift aktif
        $activeShift = Shift::where('user_id', $user->id)
                            ->where('status', 'active')
                            ->first();

        if (! $activeShift) {
            return $this->forbiddenResponse('Tidak ada shift aktif. Mulai shift terlebih dahulu sebelum mencatat reservasi.');
        }

        $invoiceNumber     = $this->reservationService->generateInvoiceNumber();
        $remainingBalance  = $this->reservationService->calculateRemainingBalance(
            $request->room_price,
            $request->down_payment
        );

        $reservation = Reservation::create([
            'shift_id'          => $activeShift->id,
            'user_id'           => $user->id,
            'invoice_number'    => $invoiceNumber,
            'guest_name'        => $request->guest_name,
            'room_number'       => $request->room_number,
            'reservation_date'  => $request->reservation_date,
            'check_in_date'     => $request->check_in_date,
            'check_out_date'    => $request->check_out_date,
            'room_price'        => $request->room_price,
            'down_payment'      => $request->down_payment,
            'remaining_balance' => $remainingBalance,
            'payment_method'    => $request->payment_method,
            'payment_status'    => $request->payment_status,
            'source'            => $request->source,
            'status'            => 'reserved',
            'remarks'           => $request->remarks,
        ]);

        $reservation->load('user');

        // Auto-create KAS jika ada down_payment
        if ($reservation->down_payment > 0) {
            app(KasAutomationService::class)->createFromReservation(
                $reservation,
                'reservasi',
                $reservation->down_payment
            );
        }

        $this->activityLog->log(
            'reservation',
            'create',
            'Membuat reservasi ' . $invoiceNumber . ' untuk tamu "' . $reservation->guest_name . '" kamar ' . $reservation->room_number,
            ['invoice' => $invoiceNumber, 'guest' => $reservation->guest_name, 'room' => $reservation->room_number, 'down_payment' => (float)$reservation->down_payment, 'remaining' => (float)$reservation->remaining_balance]
        );

        return $this->successResponse(
            new ReservationResource($reservation),
            'Reservasi berhasil dicatat. Invoice: ' . $invoiceNumber,
            201
        );
    }

    /**
     * GET /api/v1/reservations/{id}
     */
    public function show(string $id): JsonResponse
    {
        $reservation = Reservation::with('user')->find($id);

        if (! $reservation) {
            return $this->notFoundResponse('Reservasi tidak ditemukan.');
        }

        return $this->successResponse(
            new ReservationResource($reservation),
            'Detail reservasi berhasil diambil.'
        );
    }

    /**
     * PUT /api/v1/reservations/{id}
     */
    public function update(UpdateReservationRequest $request, string $id): JsonResponse
    {
        $reservation = Reservation::find($id);

        if (! $reservation) {
            return $this->notFoundResponse('Reservasi tidak ditemukan.');
        }

        // Prevent editing after check-in/checkout/cancel/noshow
        if (in_array($reservation->status, ['checkin', 'checkout', 'cancel', 'noshow'])) {
            return $this->forbiddenResponse('Reservasi tidak bisa diubah karena status sudah ' . $reservation->status . '.');
        }

        // Determine new values (merge with existing data for fields not sent)
        $oldDownPayment   = (float) $reservation->down_payment;
        $newRoomPrice   = $request->input('room_price', $reservation->room_price);
        $newDownPayment = $request->input('down_payment', $reservation->down_payment);

        // Recalculate remaining balance
        $remainingBalance = $this->reservationService->calculateRemainingBalance($newRoomPrice, $newDownPayment);

        // Update reservation fields
        $reservation->update([
            ...$request->validated(),
            'remaining_balance' => $remainingBalance,
        ]);

        // ── Adjust auto-generated KAS transaction for down_payment ──
        if ($newDownPayment != $oldDownPayment) {
            $kasDp = KasTransaction::where('source_reference', 'reservation:' . $reservation->invoice_number)
                ->where('transaction_type', 'reservasi')
                ->where('auto_generated', true)
                ->first();

            if ($kasDp) {
                if ($newDownPayment > 0) {
                    $kasDp->update(['amount' => $newDownPayment]);
                } else {
                    // DP set to 0 → delete the KAS transaction
                    $kasDp->delete();
                }
            } elseif ($newDownPayment > 0) {
                // No existing KAS but DP is now > 0 → create one
                app(KasAutomationService::class)->createFromReservation(
                    $reservation,
                    'reservasi',
                    $newDownPayment
                );
            }
        }

        $reservation->load('user');

        $this->activityLog->log(
            'reservation',
            'update',
            'Memperbarui reservasi ' . $reservation->invoice_number . ' tamu "' . $reservation->guest_name . '"',
            ['invoice' => $reservation->invoice_number, 'room_price' => (float) $newRoomPrice, 'down_payment' => (float) $newDownPayment, 'remaining' => (float) $remainingBalance]
        );

        return $this->successResponse(
            new ReservationResource($reservation),
            'Reservasi berhasil diperbarui.'
        );
    }

    /**
     * DELETE /api/v1/reservations/{id}  → soft delete
     */
    public function destroy(string $id): JsonResponse
    {
        $reservation = Reservation::find($id);

        if (! $reservation) {
            return $this->notFoundResponse('Reservasi tidak ditemukan.');
        }

        $reservation->delete();

        $this->activityLog->log(
            'reservation',
            'delete',
            'Menghapus reservasi ' . $reservation->invoice_number . ' tamu "' . $reservation->guest_name . '" kamar ' . $reservation->room_number,
            ['invoice' => $reservation->invoice_number, 'guest' => $reservation->guest_name, 'room' => $reservation->room_number]
        );

        return $this->successResponse(null, 'Reservasi berhasil dihapus.');
    }

    /**
     * PUT /api/v1/reservations/{id}/status
     */
    public function updateStatus(UpdateStatusRequest $request, string $id): JsonResponse
    {
        $reservation = Reservation::find($id);

        if (! $reservation) {
            return $this->notFoundResponse('Reservasi tidak ditemukan.');
        }

        $updateData = ['status' => $request->status];

        // Saat check-in: otomatis tandai pembayaran lunas + catat KAS pelunasan
        if ($request->status === 'checkin') {
            $updateData['payment_status'] = 'lunas';

            if ($reservation->remaining_balance > 0) {
                // KAS checkin masuk ke shift staff yang melakukan check-in, BUKAN shift pembuat reservasi
                $currentUser   = Auth::user();
                $activeShiftId = Shift::where('user_id', $currentUser->id)
                    ->where('status', 'active')
                    ->value('id');

                app(KasAutomationService::class)->createFromReservation(
                    $reservation,
                    'checkin',
                    $reservation->remaining_balance,
                    $activeShiftId,     // shift staff yang check-in
                    $currentUser->id     // staff yang check-in
                );
            }

            // Set remaining_balance ke 0 karena sudah dilunasi
            $updateData['remaining_balance'] = 0;
        }

        $reservation->update($updateData);
        $reservation->load('user');

        $statusLabels = [
            'reserved' => 'Reserved',
            'checkin'  => 'Check-In',
            'checkout' => 'Check-Out',
            'cancel'   => 'Dibatalkan',
            'noshow'   => 'No Show',
        ];

        $message = 'Status reservasi berhasil diubah menjadi ' . ($statusLabels[$request->status] ?? $request->status) . '.';
        if ($request->status === 'checkin') {
            $message .= ' Pembayaran ditandai lunas.';
        }

        $this->activityLog->log(
            'reservation',
            $request->status === 'checkin' ? 'checkin' : 'update_status',
            'Mengubah status reservasi ' . $reservation->invoice_number . ' (' . $reservation->guest_name . ') menjadi ' . ($statusLabels[$request->status] ?? $request->status),
            ['invoice' => $reservation->invoice_number, 'guest' => $reservation->guest_name, 'status' => $request->status, 'payment_status' => $reservation->payment_status]
        );

        return $this->successResponse(
            new ReservationResource($reservation),
            $message
        );
    }

    /**
     * GET /api/v1/reservations/{id}/invoice  → download PDF invoice
     */
    public function invoice(string $id): mixed
    {
        $reservation = Reservation::with('user')->find($id);

        if (! $reservation) {
            return response()->json(['success' => false, 'message' => 'Reservasi tidak ditemukan.'], 404);
        }

        $data = [
            'reservation' => $reservation,
        ];

        $filename = 'invoice-' . $reservation->invoice_number . '.pdf';

        return PDF::loadView('pdf.invoice-reservasi', $data)
                  ->download($filename);
    }

    /**
     * GET /api/v1/reservations/availability
     */
    public function availability(Request $request): JsonResponse
    {
        $request->validate([
            'check_in_date'  => ['required', 'date'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
        ], [
            'check_in_date.required'   => 'Tanggal check-in wajib diisi.',
            'check_out_date.required'  => 'Tanggal check-out wajib diisi.',
            'check_out_date.after'     => 'Tanggal check-out harus setelah tanggal check-in.',
        ]);

        $availableRooms = $this->reservationService->getAvailableRooms(
            $request->check_in_date,
            $request->check_out_date
        );

        return $this->successResponse(
            [
                'available_rooms' => $availableRooms,
                'total'           => count($availableRooms),
                'check_in_date'   => $request->check_in_date,
                'check_out_date'  => $request->check_out_date,
            ],
            'Data ketersediaan kamar berhasil diambil.'
        );
    }

    /**
     * GET /api/v1/reservations/export/pdf
     */
    public function exportPdf(Request $request): mixed
    {
        $query = Reservation::with('user');

        if ($request->filled('date_from')) {
            $query->whereDate('reservation_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('reservation_date', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        $reservations = $query->orderBy('reservation_date', 'asc')->get();
        $totalRevenue = $reservations->whereNotIn('status', ['cancel', 'noshow'])->sum('room_price');

        $data = [
            'reservations' => $reservations,
            'total_revenue' => $totalRevenue,
            'date_from'    => $request->date_from,
            'date_to'      => $request->date_to,
        ];

        return PDF::loadView('pdf.laporan-reservasi', $data)
                  ->download('laporan-reservasi-' . now()->format('Ymd-His') . '.pdf');
    }
}
