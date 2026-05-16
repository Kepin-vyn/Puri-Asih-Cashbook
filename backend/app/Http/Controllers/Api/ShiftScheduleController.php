<?php

namespace App\Http\Controllers\Api;

use App\Models\ShiftSchedule;
use App\Models\User;
use App\Http\Requests\ShiftSchedule\StoreScheduleRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftScheduleController extends BaseApiController
{
    /**
     * GET /shift-schedules
     * List semua jadwal. Filter: user_id, week_start_date.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ShiftSchedule::with('user:id,name,shift')
            ->orderBy('week_start_date', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('week_start_date')) {
            $query->where('week_start_date', $request->week_start_date);
        }

        $schedules = $query->paginate(20);

        return $this->successResponse(
            $schedules->items(),
            'Jadwal berhasil diambil.',
            200,
            [
                'total'        => $schedules->total(),
                'per_page'     => $schedules->perPage(),
                'current_page' => $schedules->currentPage(),
                'last_page'    => $schedules->lastPage(),
            ]
        );
    }

    /**
     * POST /shift-schedules
     * Buat atau update jadwal (upsert berdasarkan user_id + week_start_date).
     */
    public function store(StoreScheduleRequest $request): JsonResponse
    {
        $schedule = ShiftSchedule::updateOrCreate(
            [
                'user_id'         => $request->user_id,
                'week_start_date' => $request->week_start_date,
            ],
            [
                'monday'     => $request->monday,
                'tuesday'    => $request->tuesday,
                'wednesday'  => $request->wednesday,
                'thursday'   => $request->thursday,
                'friday'     => $request->friday,
                'saturday'   => $request->saturday,
                'sunday'     => $request->sunday,
                'created_by' => auth()->id(),
            ]
        );

        $schedule->load('user:id,name,shift');

        return $this->successResponse(
            $schedule,
            'Jadwal berhasil disimpan.',
            201
        );
    }

    /**
     * PUT /shift-schedules/{id}
     * Update jadwal yang sudah ada.
     */
    public function update(StoreScheduleRequest $request, int $id): JsonResponse
    {
        $schedule = ShiftSchedule::find($id);

        if (! $schedule) {
            return $this->notFoundResponse('Jadwal tidak ditemukan.');
        }

        $schedule->update([
            'monday'     => $request->monday,
            'tuesday'    => $request->tuesday,
            'wednesday'  => $request->wednesday,
            'thursday'   => $request->thursday,
            'friday'     => $request->friday,
            'saturday'   => $request->saturday,
            'sunday'     => $request->sunday,
            'created_by' => auth()->id(),
        ]);

        $schedule->load('user:id,name,shift');

        return $this->successResponse($schedule, 'Jadwal berhasil diperbarui.');
    }

    /**
     * DELETE /shift-schedules/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $schedule = ShiftSchedule::find($id);

        if (! $schedule) {
            return $this->notFoundResponse('Jadwal tidak ditemukan.');
        }

        $schedule->delete();

        return $this->successResponse(null, 'Jadwal berhasil dihapus.');
    }

    /**
     * GET /shift-schedules/week?date=2026-05-12
     * Jadwal semua FO untuk minggu dari tanggal yang diberikan.
     */
    public function getWeek(Request $request): JsonResponse
    {
        $date      = $request->get('date', now()->toDateString());
        $weekStart = Carbon::parse($date)->startOfWeek(Carbon::MONDAY)->toDateString();

        $foUsers = User::where('role', 'fo')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'shift']);

        $schedules = ShiftSchedule::where('week_start_date', $weekStart)
            ->get()
            ->keyBy('user_id');

        $result = $foUsers->map(function (User $user) use ($schedules, $weekStart) {
            $schedule = $schedules->get($user->id);

            return [
                'user_id'         => $user->id,
                'user_name'       => $user->name,
                'default_shift'   => $user->shift,
                'schedule_id'     => $schedule?->id,
                'week_start_date' => $weekStart,
                'monday'          => $schedule?->monday    ?? 'off',
                'tuesday'         => $schedule?->tuesday   ?? 'off',
                'wednesday'       => $schedule?->wednesday ?? 'off',
                'thursday'        => $schedule?->thursday  ?? 'off',
                'friday'          => $schedule?->friday    ?? 'off',
                'saturday'        => $schedule?->saturday  ?? 'off',
                'sunday'          => $schedule?->sunday    ?? 'off',
            ];
        });

        return $this->successResponse(
            $result,
            'Jadwal minggu berhasil diambil.',
            200,
            ['week_start_date' => $weekStart]
        );
    }

    /**
     * GET /shift-schedules/today
     * Shift hari ini untuk FO yang login.
     * Fallback ke users.shift jika belum ada jadwal minggu ini.
     */
    public function getTodayShift(Request $request): JsonResponse
    {
        $user      = auth()->user();
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $schedule = ShiftSchedule::where('user_id', $user->id)
            ->where('week_start_date', $weekStart)
            ->first();

        $shiftType = $schedule?->today_shift ?? $user->shift ?? 'pagi';

        $shiftLabels = [
            'pagi'  => 'Pagi',
            'siang' => 'Siang',
            'malam' => 'Malam',
            'off'   => 'Libur',
        ];

        $shiftHours = [
            'pagi'  => '08:00 - 15:00',
            'siang' => '15:00 - 22:00',
            'malam' => '22:00 - 08:00',
            'off'   => null,
        ];

        return $this->successResponse(
            [
                'shift_type'      => $shiftType,
                'shift_label'     => $shiftLabels[$shiftType] ?? $shiftType,
                'shift_hours'     => $shiftHours[$shiftType] ?? null,
                'is_off'          => $shiftType === 'off',
                'from_schedule'   => $schedule !== null,
                'week_start_date' => $weekStart,
            ],
            'Shift hari ini berhasil diambil.'
        );
    }
}
