<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Payroll\SetDailyRateRequest;
use App\Models\Payroll;
use App\Models\PayrollSetting;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\PayrollService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class PayrollController extends BaseApiController
{
    public function __construct(
        private PayrollService    $payrollService,
        private AttendanceService $attendanceService
    ) {}

    /**
     * GET /api/v1/payroll
     * List semua payroll. Filter: month (Y-m), year.
     */
    public function index(): JsonResponse
    {
        $request = request();
        $query   = Payroll::with('user')->orderBy('year', 'desc')->orderBy('month', 'desc');

        if ($request->filled('month')) {
            try {
                $date = Carbon::createFromFormat('Y-m', $request->month);
                $query->where('month', $date->month)->where('year', $date->year);
            } catch (\Exception) {
                return $this->errorResponse('Format bulan tidak valid. Gunakan Y-m (contoh: 2026-05).', null, 422);
            }
        }

        if ($request->filled('year')) {
            $query->where('year', (int) $request->year);
        }

        $payrolls = $query->paginate(30);

        return $this->successResponse(
            $payrolls->items(),
            'Data payroll berhasil diambil.',
            200,
            [
                'current_page' => $payrolls->currentPage(),
                'last_page'    => $payrolls->lastPage(),
                'per_page'     => $payrolls->perPage(),
                'total'        => $payrolls->total(),
            ]
        );
    }

    /**
     * GET /api/v1/payroll/{month}
     * Semua payroll untuk bulan tertentu. Format month: YYYY-MM.
     */
    public function monthly(string $month): JsonResponse
    {
        try {
            $date = Carbon::createFromFormat('Y-m', $month);
        } catch (\Exception) {
            return $this->errorResponse('Format bulan tidak valid. Gunakan YYYY-MM (contoh: 2026-05).', null, 422);
        }

        $payrolls = Payroll::with('user')
            ->where('month', $date->month)
            ->where('year', $date->year)
            ->orderBy('user_id')
            ->get();

        $totalGaji = $payrolls->sum('total_salary');

        return $this->successResponse(
            $payrolls,
            'Data payroll bulanan berhasil diambil.',
            200,
            [
                'period'      => $date->translatedFormat('F Y'),
                'month'       => $date->month,
                'year'        => $date->year,
                'staff_count' => $payrolls->count(),
                'total_gaji'  => (float) $totalGaji,
                'total_gaji_formatted' => 'Rp ' . number_format($totalGaji, 0, ',', '.'),
            ]
        );
    }

    /**
     * GET /api/v1/payroll/{month}/{staffId}
     * Detail payroll satu staff untuk bulan tertentu.
     */
    public function detail(string $month, string $staffId): JsonResponse
    {
        try {
            $date = Carbon::createFromFormat('Y-m', $month);
        } catch (\Exception) {
            return $this->errorResponse('Format bulan tidak valid. Gunakan YYYY-MM (contoh: 2026-05).', null, 422);
        }

        $staff = User::find($staffId);
        if (! $staff) {
            return $this->notFoundResponse('Staff tidak ditemukan.');
        }

        $payroll = Payroll::with('user')
            ->where('user_id', $staffId)
            ->where('month', $date->month)
            ->where('year', $date->year)
            ->first();

        if (! $payroll) {
            return $this->notFoundResponse('Data payroll belum dihitung untuk periode ini. Jalankan kalkulasi terlebih dahulu.');
        }

        // Ambil detail kehadiran
        $attendance = $this->attendanceService->getMonthlyAttendance(
            (int) $staffId,
            $date->month,
            $date->year
        );

        return $this->successResponse(
            [
                'payroll'    => $payroll,
                'attendance' => [
                    'total_hadir'   => $attendance['total_hadir'],
                    'total_libur'   => $attendance['total_libur'],
                    'total_sakit'   => $attendance['total_sakit'],
                    'total_izin'    => $attendance['total_izin'],
                    'total_alpha'   => $attendance['total_alpha'],
                    'libur_dibayar' => $attendance['libur_dibayar'],
                    'hari_bayar'    => $attendance['hari_bayar'],
                ],
                'staff' => [
                    'id'    => $staff->id,
                    'name'  => $staff->name,
                    'shift' => $staff->shift,
                    'role'  => $staff->role,
                ],
            ],
            'Detail payroll berhasil diambil.'
        );
    }

    /**
     * POST /api/v1/payroll/calculate/{month}
     * Hitung/recalculate payroll semua staff FO untuk bulan tertentu.
     */
    public function calculate(string $month): JsonResponse
    {
        try {
            $date = Carbon::createFromFormat('Y-m', $month);
        } catch (\Exception) {
            return $this->errorResponse('Format bulan tidak valid. Gunakan YYYY-MM (contoh: 2026-05).', null, 422);
        }

        $payrolls = $this->payrollService->calculateAllStaff($date->month, $date->year);

        $totalGaji = $payrolls->sum('total_salary');

        return $this->successResponse(
            $payrolls,
            'Kalkulasi payroll berhasil.',
            200,
            [
                'period'      => $date->month . '/' . $date->year,
                'staff_count' => $payrolls->count(),
                'total_gaji'  => (float) $totalGaji,
                'total_gaji_formatted' => 'Rp ' . number_format($totalGaji, 0, ',', '.'),
            ]
        );
    }

    /**
     * GET /api/v1/payroll/{month}/export/pdf
     * Rekap gaji seluruh staff bulan tertentu.
     */
    public function exportPdf(string $month): mixed
    {
        try {
            $date = Carbon::createFromFormat('Y-m', $month);
        } catch (\Exception) {
            return $this->errorResponse('Format bulan tidak valid.', null, 422);
        }

        $payrolls = Payroll::with('user')
            ->where('month', $date->month)
            ->where('year', $date->year)
            ->orderBy('user_id')
            ->get();

        $totalGaji = $payrolls->sum('total_salary');

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April',   5 => 'Mei',       6 => 'Juni',
            7 => 'Juli',    8 => 'Agustus',   9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $viewData = [
            'payrolls'     => $payrolls,
            'total_gaji'   => $totalGaji,
            'period'       => ($months[$date->month] ?? $date->month) . ' ' . $date->year,
            'month'        => $date->month,
            'year'         => $date->year,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = 'rekap-gaji-' . str_pad($date->month, 2, '0', STR_PAD_LEFT) . '-' . $date->year . '.pdf';

        return PDF::loadView('pdf.rekap-penggajian', $viewData)
                  ->setPaper('a4', 'portrait')
                  ->download($filename);
    }

    /**
     * GET /api/v1/payroll/{month}/{staffId}/slip
     * Slip gaji satu staff.
     */
    public function slip(string $month, string $staffId): mixed
    {
        try {
            $date = Carbon::createFromFormat('Y-m', $month);
        } catch (\Exception) {
            return $this->errorResponse('Format bulan tidak valid.', null, 422);
        }

        $staff = User::find($staffId);
        if (! $staff) {
            return $this->notFoundResponse('Staff tidak ditemukan.');
        }

        $payroll = Payroll::where('user_id', $staffId)
            ->where('month', $date->month)
            ->where('year', $date->year)
            ->first();

        if (! $payroll) {
            return $this->notFoundResponse('Data payroll belum dihitung untuk periode ini.');
        }

        $attendance = $this->attendanceService->getMonthlyAttendance(
            (int) $staffId,
            $date->month,
            $date->year
        );

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April',   5 => 'Mei',       6 => 'Juni',
            7 => 'Juli',    8 => 'Agustus',   9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $viewData = [
            'staff'        => $staff,
            'payroll'      => $payroll,
            'attendance'   => $attendance,
            'period'       => ($months[$date->month] ?? $date->month) . ' ' . $date->year,
            'month'        => $date->month,
            'year'         => $date->year,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $safeName = str_replace(' ', '-', strtolower($staff->name));
        $filename = 'slip-gaji-' . $safeName . '-' . str_pad($date->month, 2, '0', STR_PAD_LEFT) . '-' . $date->year . '.pdf';

        return PDF::loadView('pdf.slip-gaji', $viewData)
                  ->setPaper('a4', 'portrait')
                  ->download($filename);
    }

    /**
     * PUT /api/v1/payroll/settings/daily-rate
     * Manager only — set tarif harian.
     */
    public function setDailyRate(SetDailyRateRequest $request): JsonResponse
    {
        $setting = PayrollSetting::create([
            'daily_rate'     => $request->daily_rate,
            'effective_date' => Carbon::today(),
            'set_by'         => Auth::id(),
        ]);

        $setting->load('setter');

        return $this->successResponse(
            $setting,
            'Tarif harian berhasil diperbarui.',
            201
        );
    }
}
