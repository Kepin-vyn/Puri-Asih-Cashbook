<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Attendance\CheckinRequest;
use App\Http\Requests\Attendance\UpdateStatusRequest;
use App\Models\Attendance;
use App\Models\Shift;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends BaseApiController
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * GET /api/v1/attendance
     * FO     : hanya absensi miliknya sendiri
     * Manager: semua absensi, support filter
     *
     * Query params: month (Y-m), staff_id
     */
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $query = Attendance::with('user');

        if ($user->role === 'fo') {
            $query->where('user_id', $user->id);
        } else {
            // Manager: filter opsional
            if ($request->filled('staff_id')) {
                $query->where('user_id', $request->staff_id);
            }
        }

        // Filter bulan (format: Y-m, contoh: 2026-05)
        if ($request->filled('month')) {
            try {
                $date = Carbon::createFromFormat('Y-m', $request->month);
                $query->whereMonth('attendance_date', $date->month)
                      ->whereYear('attendance_date', $date->year);
            } catch (\Exception $e) {
                return $this->errorResponse('Format bulan tidak valid. Gunakan format Y-m (contoh: 2026-05).', null, 422);
            }
        }

        $attendances = $query->orderBy('attendance_date', 'desc')->paginate(30);

        return $this->successResponse(
            $attendances->items(),
            'Data absensi berhasil diambil.',
            200,
            [
                'current_page' => $attendances->currentPage(),
                'last_page'    => $attendances->lastPage(),
                'per_page'     => $attendances->perPage(),
                'total'        => $attendances->total(),
            ]
        );
    }

    /**
     * POST /api/v1/attendance/checkin
     */
    public function checkin(CheckinRequest $request): JsonResponse
    {
        $user  = Auth::user();
        $today = Carbon::today();

        // Cek sudah absen hari ini
        $alreadyCheckedIn = Attendance::where('user_id', $user->id)
            ->whereDate('attendance_date', $today)
            ->exists();

        if ($alreadyCheckedIn) {
            return $this->errorResponse('Anda sudah melakukan absen hari ini.', null, 422);
        }

        $now = Carbon::now();

        // Cek keterlambatan
        $isLate = $this->attendanceService->checkIsLate($request->shift_type, $now);

        // Ambil shift aktif jika ada
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        $attendance = Attendance::create([
            'user_id'           => $user->id,
            'shift_id'          => $activeShift?->id,
            'shift_type'        => $request->shift_type,
            'actual_start'      => $now,
            'status'            => 'hadir',
            'is_late'           => $isLate,
            'digital_signature' => $request->digital_signature,
            'attendance_date'   => $today,
        ]);

        $attendance->load('user');

        return $this->successResponse(
            $attendance,
            $isLate
                ? 'Check-in berhasil. Catatan: Anda terlambat.'
                : 'Check-in berhasil.',
            201
        );
    }

    /**
     * POST /api/v1/attendance/checkout
     */
    public function checkout(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $today = Carbon::today();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('attendance_date', $today)
            ->first();

        if (! $attendance) {
            return $this->errorResponse('Anda belum melakukan check-in hari ini.', null, 422);
        }

        if ($attendance->actual_end) {
            return $this->errorResponse('Anda sudah melakukan check-out hari ini.', null, 422);
        }

        $attendance->update(['actual_end' => Carbon::now()]);
        $attendance->load('user');

        return $this->successResponse($attendance, 'Check-out berhasil.');
    }

    /**
     * PUT /api/v1/attendance/{id}/status
     * Manager only — diproteksi via middleware role:manager di routes
     */
    public function updateStatus(UpdateStatusRequest $request, string $id): JsonResponse
    {
        $attendance = Attendance::with('user')->find($id);

        if (! $attendance) {
            return $this->notFoundResponse('Data absensi tidak ditemukan.');
        }

        $attendance->update(['status' => $request->status]);

        return $this->successResponse($attendance, 'Status absensi berhasil diperbarui.');
    }

    /**
     * GET /api/v1/attendance/monthly/{staffId}
     * Ringkasan kehadiran bulanan staff tertentu.
     *
     * Query params: month (1-12), year
     */
    public function monthly(string $staffId): JsonResponse
    {
        $request = request();
        $month   = (int) $request->get('month', now()->month);
        $year    = (int) $request->get('year',  now()->year);

        if ($month < 1 || $month > 12) {
            return $this->errorResponse('Bulan tidak valid. Gunakan angka 1-12.', null, 422);
        }

        $summary = $this->attendanceService->getMonthlyAttendance((int) $staffId, $month, $year);

        // Tambahkan info user
        $user = \App\Models\User::find($staffId);
        if (! $user) {
            return $this->notFoundResponse('Staff tidak ditemukan.');
        }

        return $this->successResponse(
            array_merge($summary, [
                'staff_name'  => $user->name,
                'staff_shift' => $user->shift,
                'staff_role'  => $user->role,
            ]),
            'Ringkasan kehadiran bulanan berhasil diambil.'
        );
    }
}
