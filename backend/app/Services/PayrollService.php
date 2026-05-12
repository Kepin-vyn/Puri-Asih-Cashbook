<?php

namespace App\Services;

use App\Models\Payroll;
use App\Models\PayrollSetting;
use App\Models\User;

class PayrollService
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * Hitung atau recalculate payroll satu staff untuk bulan tertentu.
     *
     * @param  int  $userId
     * @param  int  $month
     * @param  int  $year
     * @return Payroll
     */
    public function calculateMonthlyPayroll(int $userId, int $month, int $year): Payroll
    {
        // Ambil data kehadiran
        $attendance = $this->attendanceService->getMonthlyAttendance($userId, $month, $year);

        // Ambil daily_rate terbaru
        $setting   = PayrollSetting::orderBy('effective_date', 'desc')->first();
        $dailyRate = $setting ? (float) $setting->daily_rate : 0;

        // Kalkulasi
        $totalPresent = $attendance['hari_bayar'];   // hadir + libur (maks 6)
        $totalLeave   = $attendance['total_libur'];
        $totalAbsent  = $attendance['total_sakit']
                      + $attendance['total_izin']
                      + $attendance['total_alpha'];
        $totalSalary  = $totalPresent * $dailyRate;

        // Simpan atau update
        $payroll = Payroll::updateOrCreate(
            [
                'user_id' => $userId,
                'month'   => $month,
                'year'    => $year,
            ],
            [
                'total_present' => $totalPresent,
                'total_leave'   => $totalLeave,
                'total_absent'  => $totalAbsent,
                'daily_rate'    => $dailyRate,
                'total_salary'  => $totalSalary,
            ]
        );

        $payroll->load('user');

        return $payroll;
    }

    /**
     * Hitung payroll semua staff FO untuk bulan tertentu.
     *
     * @param  int  $month
     * @param  int  $year
     * @return \Illuminate\Support\Collection
     */
    public function calculateAllStaff(int $month, int $year)
    {
        $staffList = User::where('role', 'fo')
            ->where('status', 'active')
            ->get();

        return $staffList->map(function (User $staff) use ($month, $year) {
            return $this->calculateMonthlyPayroll($staff->id, $month, $year);
        });
    }
}
