<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\ShiftSchedule;
use App\Models\User;
use Carbon\Carbon;

class AttendanceService
{
    /**
     * Jam mulai shift (WIB).
     */
    private const SHIFT_HOURS = [
        'pagi'  => 8,
        'siang' => 15,
        'malam' => 22,
    ];

    /**
     * Toleransi keterlambatan dalam menit.
     */
    private const LATE_TOLERANCE_MINUTES = 15;

    /**
     * Cek apakah staff terlambat.
     * Prioritas: jadwal mingguan → fallback ke shift statis user.
     *
     * @param  int    $userId      ID user yang check-in
     * @param  string $shiftType   pagi|siang|malam (dari user.shift sebagai default)
     * @param  Carbon $actualStart Waktu check-in aktual
     * @return bool
     */
    public function checkIsLate(int $userId, string $shiftType, Carbon $actualStart): bool
    {
        // Cek jadwal mingguan terlebih dahulu
        $weekStart     = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $todaySchedule = ShiftSchedule::where('user_id', $userId)
            ->where('week_start_date', $weekStart)
            ->first();

        // Gunakan shift dari jadwal mingguan jika ada, fallback ke shift statis
        $resolvedShift = $todaySchedule?->today_shift ?? $shiftType;

        // Jika hari off, tidak bisa terlambat
        if ($resolvedShift === 'off') {
            return false;
        }

        $shiftHour = self::SHIFT_HOURS[$resolvedShift] ?? null;

        if ($shiftHour === null) {
            return false;
        }

        // Batas waktu = jam shift + toleransi
        $deadline = $actualStart->copy()
            ->setTime($shiftHour, self::LATE_TOLERANCE_MINUTES, 0);

        return $actualStart->gt($deadline);
    }

    /**
     * Ambil ringkasan kehadiran bulanan satu staff.
     *
     * @param  int  $userId
     * @param  int  $month
     * @param  int  $year
     * @return array
     */
    public function getMonthlyAttendance(int $userId, int $month, int $year): array
    {
        $attendances = Attendance::where('user_id', $userId)
            ->whereMonth('attendance_date', $month)
            ->whereYear('attendance_date', $year)
            ->orderBy('attendance_date', 'asc')
            ->get();

        $totalHadir = $attendances->where('status', 'hadir')->count();
        $totalLibur = $attendances->where('status', 'libur')->count();
        $totalSakit = $attendances->where('status', 'sakit')->count();
        $totalIzin  = $attendances->where('status', 'izin')->count();
        $totalAlpha = $attendances->where('status', 'alpha')->count();
        $totalLate  = $attendances->where('is_late', true)->count();

        // Hari yang dihitung untuk gaji: hadir + libur (maks 6)
        $liburDibayar  = min($totalLibur, 6);
        $hariBayar     = $totalHadir + $liburDibayar;

        return [
            'user_id'       => $userId,
            'month'         => $month,
            'year'          => $year,
            'total_hadir'   => $totalHadir,
            'total_libur'   => $totalLibur,
            'total_sakit'   => $totalSakit,
            'total_izin'    => $totalIzin,
            'total_alpha'   => $totalAlpha,
            'total_late'    => $totalLate,
            'libur_dibayar' => $liburDibayar,
            'hari_bayar'    => $hariBayar,
            'attendances'   => $attendances,
        ];
    }
}
