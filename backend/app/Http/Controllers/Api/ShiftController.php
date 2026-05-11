<?php

namespace App\Http\Controllers\Api;

use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class ShiftController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Shift::with('user');

        if ($user->role === 'fo') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('started_at', $request->date);
        }

        $shifts = $query->orderBy('started_at', 'desc')->paginate(20);

        return $this->successResponse($shifts, 'Data shift berhasil diambil.');
    }

    public function active(): JsonResponse
    {
        $activeShift = $this->getActiveShift();

        if (! $activeShift) {
            return $this->notFoundResponse('Tidak ada shift aktif saat ini.');
        }

        return $this->successResponse($activeShift, 'Shift aktif berhasil diambil.');
    }

    public function activeSummary(): JsonResponse
    {
        $activeShift = $this->getActiveShift();

        if (! $activeShift) {
            return $this->notFoundResponse('Tidak ada shift aktif saat ini.');
        }

        return $this->successResponse(
            $this->buildSummary($activeShift),
            'Ringkasan shift aktif berhasil diambil.'
        );
    }

    public function start(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($this->getActiveShift()) {
            return $this->forbiddenResponse('Shift aktif sudah berjalan.');
        }

        $validated = $request->validate([
            'type' => ['required', 'in:pagi,siang,malam'],
        ]);

        $shift = Shift::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'started_at' => Carbon::now(),
            'status' => 'active',
        ]);

        return $this->successResponse($shift, 'Shift berhasil dimulai.', 201);
    }

    public function handover(string $id, Request $request): JsonResponse
    {
        $shift = Shift::find($id);

        if (! $shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if ($shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        $validated = $request->validate([
            'handover_to' => ['nullable', 'integer'],
            'handover_note' => ['nullable', 'string'],
        ]);

        $shift->update([
            'status' => 'closed',
            'ended_at' => Carbon::now(),
            'handover_to' => $validated['handover_to'] ?? null,
            'handover_note' => $validated['handover_note'] ?? null,
        ]);

        return $this->successResponse($shift, 'Shift berhasil diserahterimakan.');
    }

    public function summary(string $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (! $shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if (Auth::user()->role === 'fo' && $shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        return $this->successResponse($this->buildSummary($shift), 'Ringkasan shift berhasil diambil.');
    }

    public function report(string $id): JsonResponse
    {
        return $this->successResponse(null, 'Fitur laporan shift belum tersedia.');
    }

    public function reportPdf(string $id): JsonResponse
    {
        return $this->successResponse(null, 'Fitur laporan shift PDF belum tersedia.');
    }

    public function daily(string $date): JsonResponse
    {
        return $this->successResponse(null, 'Fitur shift harian belum tersedia.');
    }

    public function dailyPdf(string $date): JsonResponse
    {
        return $this->successResponse(null, 'Fitur laporan harian shift PDF belum tersedia.');
    }

    private function getActiveShift(): ?Shift
    {
        return Shift::where('user_id', Auth::id())
            ->where('status', 'active')
            ->first();
    }

    private function buildSummary(Shift $shift): array
    {
        $today = Carbon::today()->toDateString();

        return [
            'shift_id' => $shift->id,
            'type' => $shift->type,
            'status' => $shift->status,
            'started_at' => $shift->started_at,
            'check_in_count' => $shift->reservations()
                ->where('status', 'checkin')
                ->whereDate('check_in_date', $today)
                ->count(),
            'check_out_count' => $shift->reservations()
                ->where('status', 'checkout')
                ->whereDate('check_out_date', $today)
                ->count(),
            'reservation_count' => $shift->reservations()
                ->whereDate('reservation_date', $today)
                ->count(),
        ];
    }
}
