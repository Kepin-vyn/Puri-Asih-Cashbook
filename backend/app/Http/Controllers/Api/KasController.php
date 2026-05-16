<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Kas\StoreKasRequest;
use App\Http\Requests\Kas\UpdateKasRequest;
use App\Http\Resources\KasTransactionResource;
use App\Models\KasTransaction;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class KasController extends BaseApiController
{
    /**
     * GET /api/v1/kas
     * FO  : hanya transaksi dari shift aktif milik sendiri
     * Manager: semua transaksi, support filter
     */
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $query = KasTransaction::with('user');

        if ($user->role === 'fo') {
            // FO hanya melihat transaksi dari shift aktifnya sendiri
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift) {
                return $this->forbiddenResponse('Anda tidak memiliki shift aktif saat ini.');
            }

            $query->where('shift_id', $activeShift->id);
        } else {
            // Manager: support filter opsional
            if ($request->filled('shift_id')) {
                $query->where('shift_id', $request->shift_id);
            }

            if ($request->filled('staff_id')) {
                $query->where('user_id', $request->staff_id);
            }
        }

        // Filter tanggal (berlaku untuk semua role)
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $query->orderBy('created_at', 'desc');

        // Hitung total sebelum paginate
        $totalAmount = (clone $query)->sum('amount');

        $transactions = $query->paginate(20);

        return $this->successResponse(
            KasTransactionResource::collection($transactions->items()),
            'Data KAS berhasil diambil.',
            200,
            [
                'total_amount'           => (int) $totalAmount,
                'total_amount_formatted' => 'Rp ' . number_format($totalAmount, 0, ',', '.'),
                'pagination'             => [
                    'current_page' => $transactions->currentPage(),
                    'last_page'    => $transactions->lastPage(),
                    'per_page'     => $transactions->perPage(),
                    'total'        => $transactions->total(),
                ],
            ]
        );
    }

    /**
     * POST /api/v1/kas
     */
    public function store(StoreKasRequest $request): JsonResponse
    {
        $user = Auth::user();

        // Cek shift aktif
        $activeShift = Shift::where('user_id', $user->id)
                            ->where('status', 'active')
                            ->first();

        if (! $activeShift) {
            return $this->forbiddenResponse('Tidak ada shift aktif. Mulai shift terlebih dahulu sebelum mencatat transaksi KAS.');
        }

        $kasTransaction = KasTransaction::create([
            'shift_id'         => $activeShift->id,
            'user_id'          => $user->id,
            'guest_name'       => $request->guest_name,
            'room_number'      => $request->room_number,
            'transaction_type' => $request->transaction_type,
            'payment_method'   => $request->payment_method,
            'amount'           => $request->amount,
            'note'             => $request->note,
        ]);

        $kasTransaction->load('user');

        return $this->successResponse(
            new KasTransactionResource($kasTransaction),
            'Transaksi KAS berhasil dicatat.',
            201
        );
    }

    /**
     * GET /api/v1/kas/{id}
     */
    public function show(string $id): JsonResponse
    {
        $user           = Auth::user();
        $kasTransaction = KasTransaction::with('user')->find($id);

        if (! $kasTransaction) {
            return $this->notFoundResponse('Transaksi KAS tidak ditemukan.');
        }

        // FO hanya bisa lihat transaksi dari shiftnya sendiri
        if ($user->role === 'fo') {
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift || $kasTransaction->shift_id !== $activeShift->id) {
                return $this->forbiddenResponse('Anda tidak memiliki akses ke transaksi ini.');
            }
        }

        return $this->successResponse(
            new KasTransactionResource($kasTransaction),
            'Detail transaksi KAS berhasil diambil.'
        );
    }

    /**
     * PUT /api/v1/kas/{id}
     */
    public function update(UpdateKasRequest $request, string $id): JsonResponse
    {
        $user           = Auth::user();
        $kasTransaction = KasTransaction::find($id);

        if (! $kasTransaction) {
            return $this->notFoundResponse('Transaksi KAS tidak ditemukan.');
        }

        // FO hanya bisa edit transaksi dari shiftnya sendiri
        if ($user->role === 'fo') {
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift || $kasTransaction->shift_id !== $activeShift->id) {
                return $this->forbiddenResponse('Anda tidak dapat mengubah transaksi ini.');
            }
        }

        // Blokir edit transaksi otomatis
        if ($kasTransaction->auto_generated) {
            return $this->errorResponse('Transaksi otomatis tidak dapat diubah.', null, 403);
        }

        $kasTransaction->update($request->validated());
        $kasTransaction->load('user');

        return $this->successResponse(
            new KasTransactionResource($kasTransaction),
            'Transaksi KAS berhasil diperbarui.'
        );
    }

    /**
     * DELETE /api/v1/kas/{id}  → soft delete
     */
    public function destroy(string $id): JsonResponse
    {
        $user           = Auth::user();
        $kasTransaction = KasTransaction::find($id);

        if (! $kasTransaction) {
            return $this->notFoundResponse('Transaksi KAS tidak ditemukan.');
        }

        // FO hanya bisa hapus dari shiftnya sendiri
        if ($user->role === 'fo') {
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift || $kasTransaction->shift_id !== $activeShift->id) {
                return $this->forbiddenResponse('Anda tidak dapat menghapus transaksi ini.');
            }
        }

        // Blokir hapus transaksi otomatis
        if ($kasTransaction->auto_generated) {
            return $this->errorResponse('Transaksi otomatis tidak dapat dihapus.', null, 403);
        }

        $kasTransaction->delete(); // Soft delete

        return $this->successResponse(null, 'Transaksi KAS berhasil dihapus.');
    }

    /**
     * POST /api/v1/kas/{id}/upload
     */
    public function upload(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
        ], [
            'receipt.required' => 'File bukti struk wajib diupload.',
            'receipt.file'     => 'Upload harus berupa file.',
            'receipt.mimes'    => 'File harus berformat JPG, PNG, atau PDF.',
            'receipt.max'      => 'Ukuran file maksimal 2MB.',
        ]);

        $kasTransaction = KasTransaction::find($id);

        if (! $kasTransaction) {
            return $this->notFoundResponse('Transaksi KAS tidak ditemukan.');
        }

        // Hapus file lama jika ada
        if ($kasTransaction->receipt_photo) {
            Storage::disk('public')->delete($kasTransaction->receipt_photo);
        }

        // Simpan file baru
        $file = $request->file('receipt');
        $path = Storage::disk('public')->putFile('receipts/kas', $file);

        $kasTransaction->update(['receipt_photo' => $path]);

        return $this->successResponse(
            [
                'receipt_photo_url' => Storage::disk('public')->url($path),
                'receipt_photo'     => $path,
            ],
            'Bukti struk berhasil diupload.'
        );
    }

    /**
     * GET /api/v1/kas/export/pdf
     */
    public function exportPdf(Request $request): mixed
    {
        $query = KasTransaction::with('user');

        // Filter tanggal
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter shift
        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->shift_id);
        }

        // Filter staff
        if ($request->filled('staff_id')) {
            $query->where('user_id', $request->staff_id);
        }

        $transactions = $query->orderBy('created_at', 'asc')->get();
        $totalAmount  = $transactions->sum('amount');

        // Ambil nama staff jika filter staff_id ada
        $staffName  = null;
        $shiftLabel = null;
        if ($request->filled('staff_id')) {
            $staff     = \App\Models\User::find($request->staff_id);
            $staffName = $staff?->name;
        }
        if ($request->filled('shift_id')) {
            $shift      = \App\Models\Shift::find($request->shift_id);
            $shiftLabel = $shift ? ucfirst($shift->type) : null;
        }

        $data = [
            'transactions' => $transactions,
            'total_amount' => $totalAmount,
            'date_from'    => $request->date_from,
            'date_to'      => $request->date_to,
            'staff_name'   => $staffName,
            'shift_label'  => $shiftLabel,
        ];

        return PDF::loadView('pdf.laporan-kas', $data)
                  ->download('laporan-kas-' . now()->format('Ymd-His') . '.pdf');
    }
}
