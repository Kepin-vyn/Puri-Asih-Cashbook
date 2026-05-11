<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\RejectExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\Shift;
use App\Services\ExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class ExpenseController extends BaseApiController
{
    private ExpenseService $expenseService;

    public function __construct(ExpenseService $expenseService)
    {
        $this->expenseService = $expenseService;
    }

    /**
     * GET /api/v1/expenses
     */
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $query = Expense::with(['user', 'approvedBy']);

        if ($user->role === 'fo') {
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
        }

        // Filter status & tanggal
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $query->orderBy('created_at', 'desc');

        // Kalkulasi Total (hanya yang sudah diapprove / auto_approved)
        $totalAutoApproved = (clone $query)->where('status', 'auto_approved')->sum('total_price');
        $totalApproved     = (clone $query)->where('status', 'approved')->sum('total_price');
        $totalPending      = (clone $query)->where('status', 'pending')->sum('total_price');
        $totalRejected     = (clone $query)->where('status', 'rejected')->sum('total_price');

        $expenses = $query->paginate(20);

        return $this->successResponse(
            ExpenseResource::collection($expenses->items()),
            'Data pengeluaran berhasil diambil.',
            200,
            [
                'totals' => [
                    'auto_approved' => (int) $totalAutoApproved,
                    'approved'      => (int) $totalApproved,
                    'pending'       => (int) $totalPending,
                    'rejected'      => (int) $totalRejected,
                    'total_valid'   => (int) ($totalAutoApproved + $totalApproved), // Hanya yang valid mengurangi KAS
                ],
                'pagination' => [
                    'current_page' => $expenses->currentPage(),
                    'last_page'    => $expenses->lastPage(),
                    'per_page'     => $expenses->perPage(),
                    'total'        => $expenses->total(),
                ],
            ]
        );
    }

    /**
     * POST /api/v1/expenses
     */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $user = Auth::user();

        // Cek shift aktif
        $activeShift = Shift::where('user_id', $user->id)
                            ->where('status', 'active')
                            ->first();

        if (! $activeShift) {
            return $this->forbiddenResponse('Tidak ada shift aktif. Mulai shift terlebih dahulu.');
        }

        $totalPrice = $this->expenseService->calculateTotal(
            $request->price_per_item,
            $request->quantity
        );

        $status = $this->expenseService->determineStatus($totalPrice);

        $expense = Expense::create([
            'shift_id'       => $activeShift->id,
            'user_id'        => $user->id,
            'description'    => $request->description,
            'price_per_item' => $request->price_per_item,
            'quantity'       => $request->quantity,
            'total_price'    => $totalPrice,
            'payment_method' => $request->payment_method,
            'status'         => $status,
        ]);

        $expense->load(['user', 'approvedBy']);

        if ($status === 'pending') {
            $this->expenseService->sendPendingNotification($expense);
        }

        $message = $status === 'pending' 
            ? 'Pengeluaran berhasil dicatat. Menunggu persetujuan Manager.' 
            : 'Pengeluaran berhasil dicatat dan disetujui otomatis.';

        return $this->successResponse(
            new ExpenseResource($expense),
            $message,
            201
        );
    }

    /**
     * GET /api/v1/expenses/{id}
     */
    public function show(string $id): JsonResponse
    {
        $user    = Auth::user();
        $expense = Expense::with(['user', 'approvedBy'])->find($id);

        if (! $expense) {
            return $this->notFoundResponse('Data pengeluaran tidak ditemukan.');
        }

        if ($user->role === 'fo') {
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift || $expense->shift_id !== $activeShift->id) {
                return $this->forbiddenResponse('Anda tidak memiliki akses ke pengeluaran ini.');
            }
        }

        return $this->successResponse(
            new ExpenseResource($expense),
            'Detail pengeluaran berhasil diambil.'
        );
    }

    /**
     * PUT /api/v1/expenses/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        // Edit hanya diperbolehkan jika status masih pending
        $expense = Expense::find($id);
        
        if (! $expense) {
            return $this->notFoundResponse('Data pengeluaran tidak ditemukan.');
        }

        if ($expense->status !== 'pending') {
            return $this->errorResponse('Hanya pengeluaran dengan status Menunggu yang dapat diubah.', null, 400);
        }

        $user = Auth::user();
        if ($user->role === 'fo') {
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift || $expense->shift_id !== $activeShift->id) {
                return $this->forbiddenResponse('Anda tidak dapat mengubah pengeluaran ini.');
            }
        }

        $validated = $request->validate([
            'description'    => ['sometimes', 'string', 'max:255'],
            'price_per_item' => ['sometimes', 'numeric', 'min:1'],
            'quantity'       => ['sometimes', 'integer', 'min:1'],
            'payment_method' => ['sometimes', 'in:tunai,transfer,qris,kartu_kredit'],
        ]);

        // Jika mengubah harga/quantity, hitung ulang dan pastikan tetap pending
        if (isset($validated['price_per_item']) || isset($validated['quantity'])) {
            $pricePerItem = $validated['price_per_item'] ?? $expense->price_per_item;
            $quantity     = $validated['quantity'] ?? $expense->quantity;
            $totalPrice   = $this->expenseService->calculateTotal($pricePerItem, $quantity);
            
            $validated['total_price'] = $totalPrice;
            $validated['status']      = $this->expenseService->determineStatus($totalPrice);
        }

        $expense->update($validated);
        $expense->load(['user', 'approvedBy']);

        return $this->successResponse(
            new ExpenseResource($expense),
            'Pengeluaran berhasil diperbarui.'
        );
    }

    /**
     * DELETE /api/v1/expenses/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $user    = Auth::user();
        $expense = Expense::find($id);

        if (! $expense) {
            return $this->notFoundResponse('Data pengeluaran tidak ditemukan.');
        }

        if ($user->role === 'fo') {
            $activeShift = Shift::where('user_id', $user->id)
                                ->where('status', 'active')
                                ->first();

            if (! $activeShift || $expense->shift_id !== $activeShift->id) {
                return $this->forbiddenResponse('Anda tidak dapat menghapus pengeluaran ini.');
            }
        }

        $expense->delete();

        return $this->successResponse(null, 'Pengeluaran berhasil dihapus.');
    }

    /**
     * POST /api/v1/expenses/{id}/upload
     */
    public function upload(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
        ]);

        $expense = Expense::find($id);

        if (! $expense) {
            return $this->notFoundResponse('Data pengeluaran tidak ditemukan.');
        }

        if ($expense->receipt_photo) {
            Storage::disk('public')->delete($expense->receipt_photo);
        }

        $file = $request->file('receipt');
        $path = Storage::disk('public')->putFile('receipts/expenses', $file);

        $expense->update(['receipt_photo' => $path]);

        return $this->successResponse(
            [
                'receipt_photo_url' => Storage::disk('public')->url($path),
                'receipt_photo'     => $path,
            ],
            'Bukti struk pengeluaran berhasil diupload.'
        );
    }

    /**
     * POST /api/v1/expenses/{id}/approve
     */
    public function approve(string $id): JsonResponse
    {
        $expense = Expense::find($id);

        if (! $expense) {
            return $this->notFoundResponse('Data pengeluaran tidak ditemukan.');
        }

        if ($expense->status !== 'pending') {
            return $this->errorResponse('Pengeluaran ini tidak dalam status Menunggu.', null, 400);
        }

        $expense->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        $expense->load(['user', 'approvedBy']);

        return $this->successResponse(
            new ExpenseResource($expense),
            'Pengeluaran berhasil disetujui.'
        );
    }

    /**
     * POST /api/v1/expenses/{id}/reject
     */
    public function reject(RejectExpenseRequest $request, string $id): JsonResponse
    {
        $expense = Expense::find($id);

        if (! $expense) {
            return $this->notFoundResponse('Data pengeluaran tidak ditemukan.');
        }

        if ($expense->status !== 'pending') {
            return $this->errorResponse('Pengeluaran ini tidak dalam status Menunggu.', null, 400);
        }

        $expense->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        $expense->load(['user', 'approvedBy']);

        return $this->successResponse(
            new ExpenseResource($expense),
            'Pengeluaran berhasil ditolak.'
        );
    }

    /**
     * GET /api/v1/expenses/pending/count
     */
    public function pendingCount(): JsonResponse
    {
        $count = Expense::where('status', 'pending')->count();

        return $this->successResponse(['count' => $count], 'Jumlah pengeluaran pending berhasil diambil.');
    }

    /**
     * GET /api/v1/expenses/export/pdf
     */
    public function exportPdf(Request $request): mixed
    {
        $query = Expense::with(['user', 'approvedBy']);

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->shift_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $expenses = $query->orderBy('created_at', 'asc')->get();
        
        $totalValidAmount = $expenses->whereIn('status', ['auto_approved', 'approved'])->sum('total_price');

        $data = [
            'expenses'     => $expenses,
            'total_amount' => $totalValidAmount,
            'date_from'    => $request->date_from,
            'date_to'      => $request->date_to,
        ];

        return PDF::loadView('pdf.laporan-pengeluaran', $data)
                  ->download('laporan-pengeluaran-' . now()->format('Ymd-His') . '.pdf');
    }
}
