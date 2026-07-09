<?php

namespace App\Http\Controllers\Api;

use App\Models\Deposit;
use App\Models\Expense;
use App\Models\KasTransaction;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Shift;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\ReservationService;
use App\Services\ShiftService;
use App\Http\Resources\NotificationResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseApiController
{
    /**
     * Agregasi semua data Dashboard FO dalam 1 query
     */
    public function fo(ShiftService $shiftService): JsonResponse
    {
        $user = Auth::user();

        // 1. Shift Aktif
        $active_shift = $shiftService->getActiveShift($user->id);
        $has_active_shift = $active_shift !== null;

        // 2. Shift Summary
        $shift_summary = null;
        if ($has_active_shift) {
            $shift_summary = $shiftService->getShiftSummary($active_shift->id);
        }

        // 3. Notifikasi 5 terbaru
        $notifications = Notification::where('user_id', $user->id)
            ->orderByRaw('CASE WHEN read_at IS NULL THEN 0 ELSE 1 END ASC')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 4. Unread count
        $unread_count = Notification::where('user_id', $user->id)
            ->unread()
            ->count();

        // 5. Expiring deposits (jatuh tempo hari ini & besok)
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();
        $expiring_deposits = Deposit::where('status', 'active')
            ->whereIn('check_out_date', [$today, $tomorrow])
            ->count();

        // 6. Reservation counts hari ini
        $check_in_count = Reservation::whereDate('check_in_date', $today)
            ->whereNotIn('status', ['cancel', 'noshow'])
            ->count();

        $check_out_count = Reservation::whereDate('check_out_date', $today)
            ->whereNotIn('status', ['cancel', 'noshow'])
            ->count();

        $reservation_count = Reservation::whereDate('created_at', $today)
            ->count();

        return $this->successResponse([
            'has_active_shift' => $has_active_shift,
            'active_shift' => $active_shift,
            'shift_summary' => $shift_summary,
            'check_in_count' => $check_in_count,
            'check_out_count' => $check_out_count,
            'reservation_count' => $reservation_count,
            'notifications' => NotificationResource::collection($notifications),
            'unread_count' => $unread_count,
            'expiring_deposits' => $expiring_deposits,
        ], 'Dashboard FO berhasil diambil.');
    }

    /**
     * Agregasi semua data Dashboard Manager dalam 1 query
     */
    public function manager(ReservationService $reservationService): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        // 1. Pending Approval Count
        $pending_approval_count = Expense::where('status', 'pending')->count();

        // 2. Today Revenue = Kas masuk + Reservasi (bukan cancel/noshow)
        $kasRevenue = KasTransaction::whereDate('created_at', $today)
            ->value(DB::raw('COALESCE(SUM(amount), 0)'));

        $reservationRevenue = Reservation::whereDate('reservation_date', $today)
            ->whereNotIn('status', ['cancel', 'noshow'])
            ->value(DB::raw('COALESCE(SUM(room_price), 0)'));

        $today_revenue = (int)$kasRevenue + (int)$reservationRevenue;

        // 3. Today Expenses (approved / auto_approved)
        $today_expenses = Expense::whereDate('created_at', $today)
            ->whereIn('status', ['approved', 'auto_approved'])
            ->value(DB::raw('COALESCE(SUM(total_price), 0)'));

        // 4. Occupancy Rate
        // Hitung unique kamar yang dibooking hari ini (check_in <= hari ini DAN check_out > hari ini)
        $bookedRooms = Reservation::whereNotIn('status', ['cancel', 'noshow'])
            ->whereDate('check_in_date', '<=', $today)
            ->whereDate('check_out_date', '>', $today)
            ->distinct('room_number')
            ->count('room_number');

        $totalRooms = count($reservationService->getAllRooms());
        $occupancy_rate = $totalRooms > 0 ? round(($bookedRooms / $totalRooms) * 100, 2) : 0;

        // 5. Active FO
        $active_fo = Shift::with('user:id,name,role')
            ->where('status', 'active')
            ->get()
            ->map(function ($shift) {
                return [
                    'id' => $shift->id,
                    'user_id' => $shift->user_id,
                    'name' => $shift->user->name ?? 'Unknown',
                    'type' => $shift->type,
                    'started_at' => $shift->started_at,
                ];
            });

        // 6. Pending expenses (5 terbaru untuk ditampilkan di dashboard)
        $pendingExpenses = Expense::where('status', 'pending')
            ->with('user:id,name')
            ->latest()
            ->limit(5)
            ->get();

        return $this->successResponse([
            'pending_approval_count' => $pending_approval_count,
            'today_revenue' => (int) $today_revenue,
            'today_expenses' => (int) $today_expenses,
            'occupancy_rate' => $occupancy_rate,
            'occupancy_count' => $bookedRooms,
            'total_rooms' => $totalRooms,
            'active_fo' => $active_fo,
            'pending_expenses' => $pendingExpenses,
        ], 'Dashboard manager berhasil diambil.');
    }

    /**
     * GET /api/v1/dashboard/fo-stats
     * Statistik produktivitas FO per staff hari ini (dari activity_logs)
     */
    public function foStats(): JsonResponse
    {
        $today = Carbon::today();

        // Ambil semua user FO
        $foUsers = User::where('role', 'fo')->get(['id', 'name', 'shift']);
        $foIds = $foUsers->pluck('id')->toArray();

        // Batch: 1 query untuk semua FO sekaligus (bukan N+1)
        $allActivities = ActivityLog::whereIn('user_id', $foIds)
            ->whereDate('created_at', $today)
            ->select('user_id', 'module', DB::raw('COUNT(*) as count'))
            ->groupBy('user_id', 'module')
            ->get()
            ->groupBy('user_id');

        $stats = $foUsers->map(function ($user) use ($allActivities) {
            $userActivities = $allActivities->get($user->id, collect());
            $activities = $userActivities->pluck('count', 'module')->toArray();
            $totalActions = array_sum($activities);

            return [
                'user_id'    => $user->id,
                'name'       => $user->name,
                'shift'      => $user->shift,
                'reservasi'  => $activities['reservation'] ?? 0,
                'kas'        => $activities['kas'] ?? 0,
                'deposit'    => $activities['deposit'] ?? 0,
                'pengeluaran'=> $activities['expense'] ?? 0,
                'absensi'    => $activities['attendance'] ?? 0,
                'total'      => $totalActions,
            ];
        });

        // Sort by total descending
        $stats = $stats->sortByDesc('total')->values();

        return $this->successResponse($stats->toArray(), 'Statistik FO hari ini berhasil diambil.');
    }
}
