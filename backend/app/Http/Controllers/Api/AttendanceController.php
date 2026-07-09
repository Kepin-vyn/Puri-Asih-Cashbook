<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Attendance\CheckinRequest;
use App\Http\Requests\Attendance\UpdateStatusRequest;
use App\Models\Attendance;
use App\Models\Shift;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends BaseApiController
{
    private ActivityLogService $activityLog;

    public function __construct(
        private AttendanceService $attendanceService,
        ActivityLogService $activityLog
    ) {
        $this->activityLog = $activityLog;
    }

    /**
     * GET /api/v1/attendance/today-shift
     * Ambil informasi shift untuk hari ini
     */
    public function todayShift(): JsonResponse
    {
        $user = Auth::user();

        // Resolve shift dari jadwal mingguan atau shift statis
        $shiftType = $this->attendanceService->resolveShift($user->id, $user->shift);
        $shiftHours = $this->attendanceService->getShiftHours($shiftType);
        $isOff = $shiftType === 'off';

        // Cek apakah saat ini dalam window shift
        $now = Carbon::now();
        $isWithinWindow = $isOff ? false : $this->attendanceService->isWithinShiftWindow($shiftType, $now);

        return $this->successResponse([
            'shift_type' => $shiftType,
            'shift_label' => ucfirst($shiftType ?? '-'),
            'shift_hours' => $shiftHours,
            'is_off' => $isOff,
            'is_within_window' => $isWithinWindow,
            'server_date' => $now->toDateString(),
        ], 'Shift hari ini');
    }

    /**
     * GET /api/v1/attendance
     * FO     : hanya absensi miliknya sendiri
     * Manager: semua absensi, support filter
     *
     * Query params: month (Y-m), staff_id
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Attendance::with('user');

        if ($user->role === 'fo') {
            $query->where('user_id', $user->id);
        } else {
            // Manager: filter opsional
            if ($request->filled('staff_id')) {
                $query->where('user_id', $request->staff_id);
            }
        }

        // Filter bulan
        // Support 2 format: month="06" + year="2026" ATAU month="2026-06"
        if ($request->filled('month')) {
            $monthParam = $request->month;

            if (str_contains($monthParam, '-')) {
                // Format Y-m (contoh: 2026-05)
                try {
                    $date = Carbon::createFromFormat('Y-m', $monthParam);
                    $query->whereMonth('attendance_date', $date->month)
                        ->whereYear('attendance_date', $date->year);
                } catch (\Exception $e) {
                    return $this->errorResponse('Format bulan tidak valid. Gunakan format Y-m (contoh: 2026-05).', null, 422);
                }
            } else {
                // Format numerik: month=06, year=2026
                $month = (int) $monthParam;
                $year = $request->filled('year') ? (int) $request->year : Carbon::now()->year;

                if ($month < 1 || $month > 12) {
                    return $this->errorResponse('Bulan tidak valid. Gunakan angka 1-12.', null, 422);
                }

                $query->whereMonth('attendance_date', $month)
                    ->whereYear('attendance_date', $year);
            }
        }

        // Filter tanggal spesifik (format: Y-m-d, contoh: 2026-06-13)
        if ($request->filled('date')) {
            $query->whereDate('attendance_date', $request->date);
        }

        $attendances = $query->orderBy('attendance_date', 'desc')->paginate(30);

        return $this->successResponse(
            $attendances->items(),
            'Data absensi berhasil diambil.',
            200,
            [
                'current_page' => $attendances->currentPage(),
                'last_page' => $attendances->lastPage(),
                'per_page' => $attendances->perPage(),
                'total' => $attendances->total(),
            ]
        );
    }

    /**
     * POST /api/v1/attendance/checkin
     */
    public function checkin(CheckinRequest $request): JsonResponse
    {
        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        // Cek sudah absen hari ini
        $alreadyCheckedIn = Attendance::where('user_id', $user->id)
            ->whereDate('attendance_date', $today)
            ->exists();

        if ($alreadyCheckedIn) {
            return $this->errorResponse('Anda sudah melakukan absen hari ini.', null, 422);
        }

        // ── Resolve shift hari ini dari jadwal mingguan / shift statis ──
        $resolvedShift = $this->attendanceService->resolveShift($user->id, $user->shift);

        // Tolak jika hari ini libur
        if ($resolvedShift === 'off') {
            return $this->errorResponse(
                'Anda dijadwalkan libur hari ini. Check-in tidak tersedia.',
                null,
                422
            );
        }

        // Tolak jika di luar jam shift (toleransi 30 menit sebelum shift)
        if (! $this->attendanceService->isWithinShiftWindow($resolvedShift, $now)) {
            $shiftHours = $this->attendanceService->getShiftHours($resolvedShift);

            return $this->errorResponse(
                "Check-in ditolak. Shift Anda hari ini adalah {$resolvedShift} ({$shiftHours}). Silakan check-in pada jam shift Anda.",
                null,
                422
            );
        }

        // Cek keterlambatan
        $isLate = $this->attendanceService->checkIsLate((int) $user->id, $request->shift_type, $now);

        // Ambil shift aktif jika ada, atau buat shift baru otomatis
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $activeShift) {
            $activeShift = Shift::create([
                'user_id' => $user->id,
                'type' => $resolvedShift,
                'started_at' => $now,
                'status' => 'active',
            ]);
        }

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'shift_id' => $activeShift->id,
            'shift_type' => $resolvedShift,
            'actual_start' => $now,
            'status' => 'hadir',
            'is_late' => $isLate,
            'digital_signature' => $request->digital_signature,
            'attendance_date' => $today,
        ]);

        $attendance->load(['user', 'shift']);

        $this->activityLog->log('attendance', 'checkin', 'Check-in absensi'.($isLate ? ' (terlambat)' : '').'. Shift '.$resolvedShift.' dimulai.', ['shift_type' => $resolvedShift, 'is_late' => $isLate], $user->id, $activeShift->id);

        return $this->successResponse(
            $attendance,
            $isLate
                ? 'Check-in berhasil. Catatan: Anda terlambat. Shift otomatis dimulai.'
                : 'Check-in berhasil. Shift otomatis dimulai.',
            201
        );
    }

    /**
     * POST /api/v1/attendance/checkout
     */
    public function checkout(Request $request): JsonResponse
    {
        $user = Auth::user();
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

        $this->activityLog->log('attendance', 'checkout', 'Check-out absensi.', ['actual_start' => $attendance->actual_start, 'actual_end' => $attendance->actual_end], $user->id, $attendance->shift_id);

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
        $month = (int) $request->get('month', now()->month);
        $year = (int) $request->get('year', now()->year);

        if ($month < 1 || $month > 12) {
            return $this->errorResponse('Bulan tidak valid. Gunakan angka 1-12.', null, 422);
        }

        $summary = $this->attendanceService->getMonthlyAttendance((int) $staffId, $month, $year);

        // Tambahkan info user
        $user = User::find($staffId);
        if (! $user) {
            return $this->notFoundResponse('Staff tidak ditemukan.');
        }

        return $this->successResponse(
            array_merge($summary, [
                'staff_name' => $user->name,
                'staff_shift' => $user->shift,
                'staff_role' => $user->role,
            ]),
            'Ringkasan kehadiran bulanan berhasil diambil.'
        );
    }
}
