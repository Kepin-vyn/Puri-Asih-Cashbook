<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Deposit\StoreDepositRequest;
use App\Http\Requests\Deposit\ForfeitDepositRequest;
use App\Http\Resources\DepositResource;
use App\Models\Deposit;
use App\Models\KasTransaction;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class DepositController extends BaseApiController
{
    /**
     * GET /api/v1/deposits
     */
    public function index(Request $request): JsonResponse
    {
        $query = Deposit::with('user')
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderBy('check_out_date', 'asc');

        // Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('check_in_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('check_out_date', '<=', $request->date_to);
        }

        // Summary sebelum paginate
        $totalActive    = (clone $query)->where('status', 'active')->sum('amount');
        $totalRefunded  = (clone $query)->where('status', 'refunded')->sum('amount');
        $totalForfeited = (clone $query)->where('status', 'forfeited')->sum('amount');

        $deposits = $query->paginate(20);

        return $this->successResponse(
            DepositResource::collection($deposits->items()),
            'Data deposit berhasil diambil.',
            200,
            [
                'summary' => [
                    'total_active'              => (int) $totalActive,
                    'total_active_formatted'    => 'Rp ' . number_format($totalActive, 0, ',', '.'),
                    'total_refunded'            => (int) $totalRefunded,
                    'total_refunded_formatted'  => 'Rp ' . number_format($totalRefunded, 0, ',', '.'),
                    'total_forfeited'           => (int) $totalForfeited,
                    'total_forfeited_formatted' => 'Rp ' . number_format($totalForfeited, 0, ',', '.'),
                    'disclaimer'                => 'Deposit bukan merupakan pemasukan hotel.',
                ],
                'pagination' => [
                    'current_page' => $deposits->currentPage(),
                    'last_page'    => $deposits->lastPage(),
                    'per_page'     => $deposits->perPage(),
                    'total'        => $deposits->total(),
                ],
            ]
        );
    }

    /**
     * POST /api/v1/deposits
     */
    public function store(StoreDepositRequest $request): JsonResponse
    {
        $user = Auth::user();

        $activeShift = Shift::where('user_id', $user->id)
                            ->where('status', 'active')
                            ->first();

        if (! $activeShift) {
            return $this->forbiddenResponse('Tidak ada shift aktif. Mulai shift terlebih dahulu sebelum mencatat deposit.');
        }

        $deposit = Deposit::create([
            'shift_id'       => $activeShift->id,
            'user_id'        => $user->id,
            'guest_name'     => $request->guest_name,
            'room_number'    => $request->room_number,
            'check_in_date'  => $request->check_in_date,
            'check_out_date' => $request->check_out_date,
            'amount'         => $request->amount,
            'payment_method' => $request->payment_method,
            'status'         => 'active',
            'note'           => $request->note,
        ]);

        $deposit->load('user');

        return $this->successResponse(
            new DepositResource($deposit),
            'Deposit berhasil dicatat.',
            201
        );
    }

    /**
     * GET /api/v1/deposits/{id}
     */
    public function show(string $id): JsonResponse
    {
        $deposit = Deposit::with('user')->find($id);

        if (! $deposit) {
            return $this->notFoundResponse('Data deposit tidak ditemukan.');
        }

        return $this->successResponse(
            new DepositResource($deposit),
            'Detail deposit berhasil diambil.'
        );
    }

    /**
     * PUT /api/v1/deposits/{id}
     */
    public function update(StoreDepositRequest $request, string $id): JsonResponse
    {
        $deposit = Deposit::find($id);

        if (! $deposit) {
            return $this->notFoundResponse('Data deposit tidak ditemukan.');
        }

        if ($deposit->status !== 'active') {
            return $this->errorResponse('Hanya deposit berstatus Aktif yang dapat diubah.', null, 400);
        }

        $deposit->update($request->validated());
        $deposit->load('user');

        return $this->successResponse(
            new DepositResource($deposit),
            'Data deposit berhasil diperbarui.'
        );
    }

    /**
     * DELETE /api/v1/deposits/{id}  → soft delete
     */
    public function destroy(string $id): JsonResponse
    {
        $deposit = Deposit::find($id);

        if (! $deposit) {
            return $this->notFoundResponse('Data deposit tidak ditemukan.');
        }

        $deposit->delete();

        return $this->successResponse(null, 'Data deposit berhasil dihapus.');
    }

    /**
     * POST /api/v1/deposits/{id}/refund
     */
    public function refund(string $id): JsonResponse
    {
        $deposit = Deposit::find($id);

        if (! $deposit) {
            return $this->notFoundResponse('Data deposit tidak ditemukan.');
        }

        if ($deposit->status !== 'active') {
            return $this->errorResponse(
                'Deposit ini tidak dapat dikembalikan. Status saat ini: ' . $deposit->status . '.',
                null,
                400
            );
        }

        // PENTING: Refund hanya mengubah status, tidak mempengaruhi kas
        $deposit->update([
            'status'      => 'refunded',
            'refund_date' => Carbon::today()->toDateString(),
        ]);

        $deposit->load('user');

        return $this->successResponse(
            new DepositResource($deposit),
            'Deposit berhasil dikembalikan kepada tamu. Catatan: refund tidak mempengaruhi laporan keuangan.'
        );
    }

    /**
     * POST /api/v1/deposits/{id}/forfeit
     */
    public function forfeit(ForfeitDepositRequest $request, string $id): JsonResponse
    {
        $deposit = Deposit::find($id);

        if (! $deposit) {
            return $this->notFoundResponse('Data deposit tidak ditemukan.');
        }

        if ($deposit->status !== 'active') {
            return $this->errorResponse(
                'Deposit ini tidak dapat dihanguskan. Status saat ini: ' . $deposit->status . '.',
                null,
                400
            );
        }

        // Update status deposit ke forfeited
        $deposit->update([
            'status' => 'forfeited',
            'note'   => $request->note,
        ]);

        $deposit->load('user');

        // Otomatis buat record KAS — deposit hangus = pemasukan hotel
        $kasNote = 'Deposit hangus - ' . $deposit->guest_name
                 . ' kamar ' . $deposit->room_number
                 . ' - ' . $request->note;

        $kasRecord = KasTransaction::create([
            'shift_id'         => $deposit->shift_id,
            'user_id'          => $deposit->user_id,
            'guest_name'       => $deposit->guest_name,
            'room_number'      => $deposit->room_number,
            'transaction_type' => 'pelunasan',
            'payment_method'   => $deposit->payment_method,
            'amount'           => $deposit->amount,
            'note'             => $kasNote,
            'auto_generated'   => true,
            'source_reference' => 'deposit:' . $deposit->id,
        ]);

        return $this->successResponse(
            [
                'deposit'     => new DepositResource($deposit),
                'kas_created' => [
                    'id'               => $kasRecord->id,
                    'amount'           => (float) $kasRecord->amount,
                    'transaction_type' => $kasRecord->transaction_type,
                    'note'             => $kasRecord->note,
                ],
            ],
            'Deposit berhasil dihanguskan dan tercatat sebagai pemasukan.'
        );
    }

    /**
     * GET /api/v1/deposits/expiring
     */
    public function expiring(): JsonResponse
    {
        $today    = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $deposits = Deposit::with('user')
            ->where('status', 'active')
            ->whereIn('check_out_date', [$today, $tomorrow])
            ->orderBy('check_out_date', 'asc')
            ->get();

        return $this->successResponse(
            DepositResource::collection($deposits),
            'Data deposit yang akan segera jatuh tempo berhasil diambil.',
            200,
            ['total' => $deposits->count()]
        );
    }

    /**
     * GET /api/v1/deposits/export/pdf
     */
    public function exportPdf(Request $request): mixed
    {
        $query = Deposit::with('user');

        if ($request->filled('date_from')) {
            $query->whereDate('check_in_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('check_out_date', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $deposits = $query->orderBy('check_out_date', 'asc')->get();

        $data = [
            'deposits'    => $deposits,
            'total_active'    => $deposits->where('status', 'active')->sum('amount'),
            'total_refunded'  => $deposits->where('status', 'refunded')->sum('amount'),
            'total_forfeited' => $deposits->where('status', 'forfeited')->sum('amount'),
            'date_from'   => $request->date_from,
            'date_to'     => $request->date_to,
        ];

        return PDF::loadView('pdf.laporan-deposit', $data)
                  ->download('laporan-deposit-' . now()->format('Ymd-His') . '.pdf');
    }
}
