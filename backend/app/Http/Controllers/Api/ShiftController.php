<?php

namespace App\Http\Controllers\Api;

use App\Models\Shift;
use App\Models\KasTransaction;
use App\Models\Expense;
use App\Models\Reservation;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class ShiftController extends BaseApiController
{
    /**
     * GET /api/v1/shifts
     * Daftar semua shift (Manager)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Shift::with('user')
            ->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date')) {
            $query->whereDate('start_time', $request->date);
        }

        $shifts = $query->paginate(20);

        return $this->successResponse(
            $shifts->items(),
            'Data shift berhasil diambil.',
            200,
            [
                'pagination' => [
                    'current_page' => $shifts->currentPage(),
                    'last_page'    => $shifts->lastPage(),
                    'total'        => $shifts->total(),
                ],
            ]
        );
    }

    /**
     * GET /api/v1/shifts/active
     * Ambil shift aktif milik user yang sedang login
     */
    public function active(): JsonResponse
    {
        $shift = Shift::with('user')
            ->where('user_id', Auth::id())
            ->where('status', 'active')
            ->first();

        if (! $shift) {
            return $this->notFoundResponse('Tidak ada shift aktif. Mulai shift terlebih dahulu.');
        }

        return $this->successResponse($shift, 'Shift aktif ditemukan.');
    }

    /**
     * GET /api/v1/shifts/active/summary
     * Dashboard FO: ringkasan shift aktif hari ini
     */
    public function activeSummary(): JsonResponse
    {
        $user  = Auth::user();
        $today = Carbon::today();

        $shift = Shift::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        // Hitung check-in hari ini (reservasi berstatus checkin, dibuat hari ini)
        $checkInCount = 0;
        $checkOutCount = 0;
        $reservationCount = 0;
        if (class_exists(\App\Models\Reservation::class)) {
            $checkInCount     = Reservation::whereDate('created_at', $today)->where('status', 'checkin')->count();
            $checkOutCount    = Reservation::whereDate('check_out_date', $today)->where('status', 'checkout')->count();
            $reservationCount = Reservation::whereDate('created_at', $today)->count();
        }

        // Revenue hari ini (KAS) — kolom: amount, filter by created_at
        $totalRevenue = KasTransaction::whereDate('created_at', $today)->sum('amount');

        // Expenses hari ini (yang sudah disetujui) — kolom: total_price, filter by created_at
        $totalExpenses = Expense::whereDate('created_at', $today)
            ->whereIn('status', ['auto_approved', 'approved'])
            ->sum('total_price');

        $finalBalance = $totalRevenue - $totalExpenses;

        // 5 notifikasi terbaru untuk user ini
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return $this->successResponse([
            'shift'             => $shift,
            'check_in_count'    => $checkInCount,
            'check_out_count'   => $checkOutCount,
            'reservation_count' => $reservationCount,
            'total_revenue'     => (int) $totalRevenue,
            'total_expenses'    => (int) $totalExpenses,
            'final_balance'     => (int) $finalBalance,
            'notifications'     => $notifications,
        ], 'Ringkasan shift aktif berhasil diambil.');
    }

    /**
     * POST /api/v1/shifts/start
     * Mulai shift baru
     */
    public function start(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Cek apakah sudah ada shift aktif
        $existing = Shift::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return $this->errorResponse('Anda sudah memiliki shift aktif. Selesaikan shift sebelumnya terlebih dahulu.', null, 400);
        }

        $shift = Shift::create([
            'user_id'    => $user->id,
            'status'     => 'active',
            'start_time' => now(),
            'note'       => $request->note,
        ]);

        $shift->load('user');

        return $this->successResponse($shift, 'Shift berhasil dimulai.', 201);
    }

    /**
     * POST /api/v1/shifts/{id}/handover
     * Selesaikan shift / handover
     */
    public function handover(Request $request, string $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (! $shift) {
            return $this->notFoundResponse('Data shift tidak ditemukan.');
        }

        if ($shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Anda tidak memiliki akses untuk shift ini.');
        }

        if ($shift->status !== 'active') {
            return $this->errorResponse('Shift ini sudah tidak aktif.', null, 400);
        }

        $shift->update([
            'status'   => 'closed',
            'end_time' => now(),
            'note'     => $request->note ?? $shift->note,
        ]);

        return $this->successResponse($shift, 'Shift berhasil diselesaikan.');
    }

    /**
     * GET /api/v1/shifts/{id}/summary
     * Ringkasan shift tertentu
     */
    public function summary(string $id): JsonResponse
    {
        $shift = Shift::with('user')->find($id);

        if (! $shift) {
            return $this->notFoundResponse('Data shift tidak ditemukan.');
        }

        $startDate = Carbon::parse($shift->start_time)->startOfDay();
        $endDate   = $shift->end_time
            ? Carbon::parse($shift->end_time)->endOfDay()
            : Carbon::now()->endOfDay();

        $totalRevenue  = KasTransaction::whereBetween('created_at', [$startDate, $endDate])->sum('total_price');
        $totalExpenses = Expense::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['auto_approved', 'approved'])
            ->sum('total_price');

        return $this->successResponse([
            'shift'          => $shift,
            'total_revenue'  => (int) $totalRevenue,
            'total_expenses' => (int) $totalExpenses,
            'final_balance'  => (int) ($totalRevenue - $totalExpenses),
        ], 'Ringkasan shift berhasil diambil.');
    }

    /**
     * GET /api/v1/shifts/{id}/report
     * Laporan shift (JSON)
     */
    public function report(string $id): JsonResponse
    {
        $shift = Shift::with('user')->find($id);

        if (! $shift) {
            return $this->notFoundResponse('Data shift tidak ditemukan.');
        }

        $startDate = Carbon::parse($shift->start_time)->startOfDay();
        $endDate   = $shift->end_time
            ? Carbon::parse($shift->end_time)->endOfDay()
            : Carbon::now()->endOfDay();

        $kas      = KasTransaction::whereBetween('created_at', [$startDate, $endDate])->get();
        $expenses = Expense::with('user')->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['auto_approved', 'approved'])
            ->get();

        return $this->successResponse([
            'shift'          => $shift,
            'kas'            => $kas,
            'expenses'       => $expenses,
            'total_revenue'  => $kas->sum('total_price'),
            'total_expenses' => $expenses->sum('total_price'),
            'final_balance'  => $kas->sum('total_price') - $expenses->sum('total_price'),
        ], 'Laporan shift berhasil diambil.');
    }

    /**
     * GET /api/v1/shifts/{id}/report/pdf
     * Laporan shift dalam format PDF
     */
    public function reportPdf(string $id): mixed
    {
        $shift = Shift::with('user')->find($id);

        if (! $shift) {
            return response()->json(['message' => 'Shift tidak ditemukan.'], 404);
        }

        $startDate = Carbon::parse($shift->start_time)->startOfDay();
        $endDate   = $shift->end_time
            ? Carbon::parse($shift->end_time)->endOfDay()
            : Carbon::now()->endOfDay();

        $kas      = KasTransaction::whereBetween('created_at', [$startDate, $endDate])->get();
        $expenses = Expense::with('user')->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['auto_approved', 'approved'])
            ->get();

        $data = [
            'shift'          => $shift,
            'kas'            => $kas,
            'expenses'       => $expenses,
            'total_revenue'  => $kas->sum('total_price'),
            'total_expenses' => $expenses->sum('total_price'),
            'final_balance'  => $kas->sum('total_price') - $expenses->sum('total_price'),
        ];

        return PDF::loadView('pdf.laporan-shift', $data)
                  ->download('laporan-shift-' . $shift->id . '.pdf');
    }

    /**
     * GET /api/v1/shifts/daily/{date}
     * Semua shift pada tanggal tertentu (Manager)
     */
    public function daily(string $date): JsonResponse
    {
        $shifts = Shift::with('user')
            ->whereDate('start_time', $date)
            ->get();

        return $this->successResponse($shifts, "Data shift tanggal {$date} berhasil diambil.");
    }

    /**
     * GET /api/v1/shifts/daily/{date}/pdf
     * Laporan harian per tanggal dalam PDF
     */
    public function dailyPdf(string $date): mixed
    {
        $shifts = Shift::with('user')
            ->whereDate('start_time', $date)
            ->get();

        $kas      = KasTransaction::whereDate('date', $date)->get();
        $expenses = Expense::with('user')->whereDate('date', $date)
            ->whereIn('status', ['auto_approved', 'approved'])
            ->get();

        $data = [
            'date'           => $date,
            'shifts'         => $shifts,
            'kas'            => $kas,
            'expenses'       => $expenses,
            'total_revenue'  => $kas->sum('total_price'),
            'total_expenses' => $expenses->sum('total_price'),
            'final_balance'  => $kas->sum('total_price') - $expenses->sum('total_price'),
        ];

        return PDF::loadView('pdf.laporan-harian', $data)
                  ->download("laporan-harian-{$date}.pdf");
    }
}
