<?php

namespace App\Http\Controllers\Api;

use App\Models\Deposit;
use App\Models\Expense;
use App\Models\KasTransaction;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Shift;
use App\Services\ReservationService;
use App\Services\ShiftService;
use App\Http\Resources\NotificationResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        return $this->successResponse([
            'has_active_shift' => $has_active_shift,
            'active_shift' => $active_shift,
            'shift_summary' => $shift_summary,
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

        return $this->successResponse([
            'pending_approval_count' => $pending_approval_count,
            'today_revenue' => (int) $today_revenue,
            'today_expenses' => (int) $today_expenses,
            'occupancy_rate' => $occupancy_rate,
            'active_fo' => $active_fo,
        ], 'Dashboard manager berhasil diambil.');
    }
}
