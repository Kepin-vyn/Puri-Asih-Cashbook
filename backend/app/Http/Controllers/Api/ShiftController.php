<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Shift\HandoverRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Attendance;
use App\Models\Shift;
use App\Services\ActivityLogService;
use App\Services\ShiftService;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShiftController extends BaseApiController
{
    protected ShiftService $shiftService;

    private ActivityLogService $activityLog;

    public function __construct(ShiftService $shiftService, ActivityLogService $activityLog)
    {
        $this->shiftService = $shiftService;
        $this->activityLog = $activityLog;
    }

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Shift::with(['user', 'handoverUser']);

        if ($user->role === 'fo') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('user_id') && $user->role === 'manager') {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('started_at', $request->date);
        }

        if ($request->filled('month')) {
            $query->whereMonth('started_at', (int) $request->month);
        }

        if ($request->filled('year')) {
            $query->whereYear('started_at', (int) $request->year);
        }

        $perPage = $request->boolean('all') ? 1000 : 20;
        $shifts = $query->orderBy('started_at', 'desc')->paginate($perPage);

        return $this->successResponse(
            ShiftResource::collection($shifts->items()),
            'Data shift berhasil diambil.',
            200,
            [
                'pagination' => [
                    'current_page' => $shifts->currentPage(),
                    'last_page' => $shifts->lastPage(),
                    'per_page' => $shifts->perPage(),
                    'total' => $shifts->total(),
                ],
            ]
        );
    }

    public function active(): JsonResponse
    {
        $activeShift = $this->shiftService->getActiveShift(Auth::id());

        if (! $activeShift) {
            return $this->notFoundResponse('Tidak ada shift aktif saat ini.');
        }

        $activeShift->load(['user', 'handoverUser']);
        $summary = $this->shiftService->getShiftSummary($activeShift->id);

        $resource = new ShiftResource($activeShift);
        $resource->additional(['summary' => $summary]);

        return $this->successResponse($resource, 'Shift aktif berhasil diambil.');
    }

    public function activeSummary(): JsonResponse
    {
        $activeShift = $this->shiftService->getActiveShift(Auth::id());

        if (! $activeShift) {
            return $this->notFoundResponse('Tidak ada shift aktif saat ini.');
        }

        return $this->successResponse(
            $this->shiftService->getShiftSummary($activeShift->id),
            'Ringkasan shift aktif berhasil diambil.'
        );
    }

    public function start(): JsonResponse
    {
        $user = Auth::user();

        if ($this->shiftService->getActiveShift($user->id)) {
            return $this->errorResponse('Kamu masih memiliki shift aktif.', null, 422);
        }

        // Cek apakah sudah checkin attendance hari ini
        $todayAttendance = Attendance::where('user_id', $user->id)
            ->whereDate('attendance_date', Carbon::today())
            ->first();

        if (! $todayAttendance) {
            return $this->errorResponse(
                'Anda harus melakukan absen masuk (check-in) dengan tanda tangan terlebih dahulu sebelum memulai shift.',
                null,
                422
            );
        }

        // Buat shift baru berdasarkan attendance
        $shift = Shift::create([
            'user_id' => $user->id,
            'type' => $todayAttendance->shift_type ?? $user->shift ?? 'pagi',
            'started_at' => Carbon::now(),
            'status' => 'active',
        ]);

        // Update attendance shift_id
        if (! $todayAttendance->shift_id) {
            $todayAttendance->update(['shift_id' => $shift->id]);
        }

        $shift->load(['user', 'handoverUser']);

        return $this->successResponse(new ShiftResource($shift), 'Shift berhasil dimulai.', 201);
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

        return $this->successResponse(
            $this->shiftService->getShiftSummary($shift->id),
            'Ringkasan shift berhasil diambil.'
        );
    }

    public function handover(string $id, HandoverRequest $request): JsonResponse
    {
        $shift = Shift::find($id);

        if (! $shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if ($shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        if ($shift->status !== 'active') {
            return $this->errorResponse('Shift sudah tidak aktif.', null, 422);
        }

        $canHandover = $this->shiftService->canHandover($shift->id);

        if (! $canHandover['can_handover']) {
            return $this->errorResponse($canHandover['message'], [
                'pending_count' => $canHandover['pending_count'],
            ], 422);
        }

        $now = Carbon::now();

        // Otomatis absen pulang (check-out attendance)
        $attendance = Attendance::where('user_id', Auth::id())
            ->whereDate('attendance_date', Carbon::today())
            ->first();

        if ($attendance && ! $attendance->actual_end) {
            $attendance->update(['actual_end' => $now]);
        }

        // Tutup shift & serah terima
        $shift->update([
            'ended_at' => $now,
            'handover_to' => $request->handover_to,
            'handover_note' => $request->handover_note,
            'status' => 'closed',
        ]);

        $reportData = $this->shiftService->generateShiftReport($shift);
        $shift->load(['user', 'handoverUser']);

        $this->activityLog->log(
            'shift',
            'handover',
            'Handover shift ke user ID '.$request->handover_to.'. Catatan: '.($request->handover_note ?? '-'),
            ['handover_to' => $request->handover_to, 'note' => $request->handover_note, 'cash_balance' => $reportData['summary']['cash_balance'] ?? 0],
            Auth::id(),
            $shift->id
        );

        return $this->successResponse([
            'shift' => new ShiftResource($shift),
            'summary' => $reportData['summary'],
        ], 'Shift berhasil diserahterimakan. Absen pulang otomatis tercatat.');
    }

    public function report(string $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (! $shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if (Auth::user()->role === 'fo' && $shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        return $this->successResponse(
            $this->shiftService->generateShiftReport($shift),
            'Laporan shift berhasil diambil.'
        );
    }

    public function reportPdf(string $id): mixed
    {
        $shift = Shift::find($id);

        if (! $shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if (Auth::user()->role === 'fo' && $shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        $reportData = $this->shiftService->generateShiftReport($shift);
        $tanggal = $shift->started_at?->format('Ymd') ?? now()->format('Ymd');
        $namaFo = str_replace(' ', '-', strtolower($shift->user->name ?? 'unknown'));
        $filename = "shift-report-{$tanggal}-{$namaFo}.pdf";

        return PDF::loadView('pdf.shift-report', $reportData)->download($filename);
    }

    public function daily(string $date): JsonResponse
    {
        $shifts = Shift::with(['user', 'handoverUser'])
            ->whereDate('started_at', $date)
            ->orderBy('started_at', 'asc')
            ->get();

        if ($shifts->isEmpty()) {
            return $this->notFoundResponse('Tidak ada shift pada tanggal tersebut.');
        }

        $shiftIds = $shifts->pluck('id')->toArray();

        $totalKas = (float) DB::table('kas_transactions')
            ->whereIn('shift_id', $shiftIds)->whereNull('deleted_at')
            ->select(DB::raw('COALESCE(SUM(amount), 0) as total'))->value('total');

        $totalExpenses = (float) DB::table('expenses')
            ->whereIn('shift_id', $shiftIds)
            ->whereIn('status', ['auto_approved', 'approved'])->whereNull('deleted_at')
            ->select(DB::raw('COALESCE(SUM(total_price), 0) as total'))->value('total');

        $totalReservasi = (float) DB::table('reservations')
            ->whereIn('shift_id', $shiftIds)->whereNull('deleted_at')
            ->select(DB::raw('COALESCE(SUM(room_price), 0) as total'))->value('total');

        $totalPemasukan = $totalKas + $totalReservasi;
        $totalPengeluaran = $totalExpenses;
        $saldoHarian = $totalPemasukan - $totalPengeluaran;

        $shiftSummaries = [];
        foreach ($shifts as $shift) {
            $shiftSummaries[] = [
                'shift' => new ShiftResource($shift),
                'summary' => $this->shiftService->getShiftSummary($shift->id),
            ];
        }

        return $this->successResponse([
            'tanggal' => Carbon::parse($date)->format('d/m/Y'),
            'tanggal_raw' => $date,
            'total_shift' => $shifts->count(),
            'ringkasan' => [
                'total_kas' => (int) $totalKas,
                'total_kas_formatted' => 'Rp '.number_format($totalKas, 0, ',', '.'),
                'total_reservasi' => (int) $totalReservasi,
                'total_reservasi_formatted' => 'Rp '.number_format($totalReservasi, 0, ',', '.'),
                'total_pemasukan' => (int) $totalPemasukan,
                'total_pemasukan_formatted' => 'Rp '.number_format($totalPemasukan, 0, ',', '.'),
                'total_pengeluaran' => (int) $totalPengeluaran,
                'total_pengeluaran_formatted' => 'Rp '.number_format($totalPengeluaran, 0, ',', '.'),
                'saldo_harian' => (int) $saldoHarian,
                'saldo_harian_formatted' => 'Rp '.number_format($saldoHarian, 0, ',', '.'),
            ],
            'shifts' => $shiftSummaries,
        ], 'Laporan harian berhasil diambil.');
    }

    public function dailyPdf(string $date): mixed
    {
        $shifts = Shift::with(['user', 'handoverUser'])
            ->whereDate('started_at', $date)
            ->orderBy('started_at', 'asc')
            ->get();

        if ($shifts->isEmpty()) {
            return $this->notFoundResponse('Tidak ada shift pada tanggal tersebut.');
        }

        $shiftIds = $shifts->pluck('id')->toArray();

        $totalKas = (float) DB::table('kas_transactions')
            ->whereIn('shift_id', $shiftIds)->whereNull('deleted_at')
            ->select(DB::raw('COALESCE(SUM(amount), 0) as total'))->value('total');

        $totalExpenses = (float) DB::table('expenses')
            ->whereIn('shift_id', $shiftIds)
            ->whereIn('status', ['auto_approved', 'approved'])->whereNull('deleted_at')
            ->select(DB::raw('COALESCE(SUM(total_price), 0) as total'))->value('total');

        $totalReservasi = (float) DB::table('reservations')
            ->whereIn('shift_id', $shiftIds)->whereNull('deleted_at')
            ->select(DB::raw('COALESCE(SUM(room_price), 0) as total'))->value('total');

        $totalPemasukan = $totalKas + $totalReservasi;
        $totalPengeluaran = $totalExpenses;
        $saldoHarian = $totalPemasukan - $totalPengeluaran;

        $shiftSummaries = [];
        foreach ($shifts as $shift) {
            $shiftSummaries[] = [
                'shift' => $shift,
                'summary' => $this->shiftService->getShiftSummary($shift->id),
            ];
        }

        $data = [
            'tanggal' => Carbon::parse($date)->format('d/m/Y'),
            'total_shift' => $shifts->count(),
            'total_kas' => $totalKas,
            'total_reservasi' => $totalReservasi,
            'total_pemasukan' => $totalPemasukan,
            'total_pengeluaran' => $totalPengeluaran,
            'saldo_harian' => $saldoHarian,
            'shift_summaries' => $shiftSummaries,
        ];

        return PDF::loadView('pdf.daily-report', $data)
            ->download("daily-report-{$date}.pdf");
    }
}
