<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\UpdateStatusRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Shift;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class ReservationController extends BaseApiController
{
    private ReservationService $reservationService;

    public function __construct(ReservationService $reservationService)
    {
        $this->reservationService = $reservationService;
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
            'status'            => 'checkin',
            'remarks'           => $request->remarks,
        ]);

        $reservation->load('user');

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
    public function update(StoreReservationRequest $request, string $id): JsonResponse
    {
        $reservation = Reservation::find($id);

        if (! $reservation) {
            return $this->notFoundResponse('Reservasi tidak ditemukan.');
        }

        // Hitung ulang remaining balance jika harga/dp berubah
        $remainingBalance = $this->reservationService->calculateRemainingBalance(
            $request->room_price,
            $request->down_payment
        );

        $reservation->update([
            ...$request->validated(),
            'remaining_balance' => $remainingBalance,
        ]);

        $reservation->load('user');

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

        $reservation->update(['status' => $request->status]);
        $reservation->load('user');

        $statusLabels = [
            'checkin'  => 'Check-In',
            'checkout' => 'Check-Out',
            'cancel'   => 'Dibatalkan',
            'noshow'   => 'No Show',
        ];

        return $this->successResponse(
            new ReservationResource($reservation),
            'Status reservasi berhasil diubah menjadi ' . ($statusLabels[$request->status] ?? $request->status) . '.'
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
