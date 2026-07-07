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
     * Window check-in: [start_hour, end_hour].
     * Shift malam melewati tengah malam (22:00 → 08:00).
     */
    private const SHIFT_WINDOWS = [
        'pagi'  => ['start' => 8,  'end' => 15],
        'siang' => ['start' => 15, 'end' => 22],
        'malam' => ['start' => 22, 'end' => 8],
    ];

    /**
     * Toleransi keterlambatan dalam menit.
     */
    private const LATE_TOLERANCE_MINUTES = 15;

    /**
     * Toleransi check-in lebih awal dalam menit.
     */
    private const EARLY_CHECKIN_MINUTES = 30;

    /**
     * Resolve shift hari ini untuk user.
     * Prioritas: jadwal mingguan → fallback ke shift statis user.
     *
     * @return string 'pagi'|'siang'|'malam'|'off'
     */
    public function resolveShift(int $userId, ?string $userShift = null): string
    {
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $schedule  = ShiftSchedule::where('user_id', $userId)
            ->where('week_start_date', $weekStart)
            ->first();

        $dayShift = $schedule?->today_shift; // accessor dari ShiftSchedule model

        if ($dayShift && $dayShift !== 'off') {
            return $dayShift;
        }

        if ($dayShift === 'off') {
            return 'off';
        }

        return $userShift ?? 'off';
    }

    /**
     * Cek apakah waktu saat ini berada dalam window check-in shift.
     * Toleransi: 30 menit sebelum shift dimulai, sampai shift berakhir.
     *
     * @param  string $shiftType pagi|siang|malam
     * @param  Carbon $now       Waktu saat ini
     * @return bool
     */
    public function isWithinShiftWindow(string $shiftType, Carbon $now): bool
    {
        $window = self::SHIFT_WINDOWS[$shiftType] ?? null;
        if (!$window) return false;

        $currentMinutes = $now->hour * 60 + $now->minute;
        $startMinutes   = $window['start'] * 60;
        $endMinutes     = $window['end'] * 60;
        $earlyMinutes   = $startMinutes - self::EARLY_CHECKIN_MINUTES;

        if ($startMinutes < $endMinutes) {
            // Shift normal (pagi: 480–900, siang: 900–1320)
            return $currentMinutes >= $earlyMinutes && $currentMinutes < $endMinutes;
        } else {
            // Shift melewati tengah malam (malam: 1320–480)
            return $currentMinutes >= $earlyMinutes || $currentMinutes < $endMinutes;
        }
    }

    /**
     * Ambil label jam shift untuk ditampilkan.
     */
    public function getShiftHours(string $shiftType): string
    {
        return match($shiftType) {
            'pagi'  => '08:00 - 15:00',
            'siang' => '15:00 - 22:00',
            'malam' => '22:00 - 08:00',
            default => '-',
        };
    }

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
