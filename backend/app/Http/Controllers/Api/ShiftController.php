<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Shift\HandoverRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shift;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class ShiftController extends BaseApiController
{
    protected ShiftService $shiftService;

    public function __construct(ShiftService $shiftService)
    {
        $this->shiftService = $shiftService;
    }

    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
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

        $shifts = $query->orderBy('started_at', 'desc')->paginate(20);

        return $this->successResponse(
            ShiftResource::collection($shifts->items()),
            'Data shift berhasil diambil.',
            200,
            [
                'pagination' => [
                    'current_page' => $shifts->currentPage(),
                    'last_page'    => $shifts->lastPage(),
                    'per_page'     => $shifts->perPage(),
                    'total'        => $shifts->total(),
                ],
            ]
        );
    }

    public function active(): JsonResponse
    {
        $activeShift = $this->shiftService->getActiveShift(Auth::id());

        if (!$activeShift) {
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

        if (!$activeShift) {
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

        $shift = Shift::create([
            'user_id'    => $user->id,
            'type'       => $user->shift ?? 'pagi',
            'started_at' => Carbon::now(),
            'status'     => 'active',
        ]);

        $shift->load(['user', 'handoverUser']);

        return $this->successResponse(new ShiftResource($shift), 'Shift berhasil dimulai.', 201);
    }

    public function summary(string $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (!$shift) {
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

        if (!$shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if ($shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        if ($shift->status !== 'active') {
            return $this->errorResponse('Shift sudah tidak aktif.', null, 422);
        }

        $canHandover = $this->shiftService->canHandover($shift->id);

        if (!$canHandover['can_handover']) {
            return $this->errorResponse($canHandover['message'], [
                'pending_count' => $canHandover['pending_count'],
            ], 422);
        }

        $shift->update([
            'ended_at'      => Carbon::now(),
            'handover_to'   => $request->handover_to,
            'handover_note' => $request->handover_note,
            'status'        => 'closed',
        ]);

        $reportData = $this->shiftService->generateShiftReport($shift);
        $shift->load(['user', 'handoverUser']);

        return $this->successResponse([
            'shift'   => new ShiftResource($shift),
            'summary' => $reportData['summary'],
        ], 'Shift berhasil diserahterimakan.');
    }

    public function report(string $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (!$shift) {
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

        if (!$shift) {
            return $this->notFoundResponse('Shift tidak ditemukan.');
        }

        if (Auth::user()->role === 'fo' && $shift->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        $reportData = $this->shiftService->generateShiftReport($shift);
        $tanggal  = $shift->started_at?->format('Ymd') ?? now()->format('Ymd');
        $namaFo   = str_replace(' ', '-', strtolower($shift->user->name ?? 'unknown'));
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

        $totalPemasukan   = $totalKas + $totalReservasi;
        $totalPengeluaran = $totalExpenses;
        $saldoHarian      = $totalPemasukan - $totalPengeluaran;

        $shiftSummaries = [];
        foreach ($shifts as $shift) {
            $shiftSummaries[] = [
                'shift'   => new ShiftResource($shift),
                'summary' => $this->shiftService->getShiftSummary($shift->id),
            ];
        }

        return $this->successResponse([
            'tanggal'     => Carbon::parse($date)->format('d/m/Y'),
            'tanggal_raw' => $date,
            'total_shift' => $shifts->count(),
            'ringkasan'   => [
                'total_kas'              => (int) $totalKas,
                'total_kas_formatted'    => 'Rp ' . number_format($totalKas, 0, ',', '.'),
                'total_reservasi'            => (int) $totalReservasi,
                'total_reservasi_formatted'  => 'Rp ' . number_format($totalReservasi, 0, ',', '.'),
                'total_pemasukan'            => (int) $totalPemasukan,
                'total_pemasukan_formatted'  => 'Rp ' . number_format($totalPemasukan, 0, ',', '.'),
                'total_pengeluaran'          => (int) $totalPengeluaran,
                'total_pengeluaran_formatted' => 'Rp ' . number_format($totalPengeluaran, 0, ',', '.'),
                'saldo_harian'               => (int) $saldoHarian,
                'saldo_harian_formatted'     => 'Rp ' . number_format($saldoHarian, 0, ',', '.'),
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

        $totalPemasukan   = $totalKas + $totalReservasi;
        $totalPengeluaran = $totalExpenses;
        $saldoHarian      = $totalPemasukan - $totalPengeluaran;

        $shiftSummaries = [];
        foreach ($shifts as $shift) {
            $shiftSummaries[] = [
                'shift'   => $shift,
                'summary' => $this->shiftService->getShiftSummary($shift->id),
            ];
        }

        $data = [
            'tanggal'           => Carbon::parse($date)->format('d/m/Y'),
            'total_shift'       => $shifts->count(),
            'total_kas'         => $totalKas,
            'total_reservasi'   => $totalReservasi,
            'total_pemasukan'   => $totalPemasukan,
            'total_pengeluaran' => $totalPengeluaran,
            'saldo_harian'      => $saldoHarian,
            'shift_summaries'   => $shiftSummaries,
        ];

        return PDF::loadView('pdf.daily-report', $data)
                  ->download("daily-report-{$date}.pdf");
    }
}
