<?php

namespace App\Http\Controllers\Api;

use App\Services\MonthlyReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\Snappy\Facades\SnappyPdf as PDF;

class ReportController extends BaseApiController
{
    protected MonthlyReportService $reportService;

    public function __construct(MonthlyReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * GET /api/v1/reports/monthly
     * Data lengkap laporan bulanan per kategori + summary
     */
    public function monthly(Request $request): JsonResponse
    {
        $month = (int) $request->input('month', now()->month);
        $year  = (int) $request->input('year', now()->year);

        $filters = [];
        if ($request->filled('staff_id')) {
            $filters['staff_id'] = $request->staff_id;
        }

        $data = $this->reportService->getMonthlyData($month, $year, $filters);

        // Filter by type jika diminta (hanya return kategori tertentu)
        if ($request->filled('type')) {
            $type = $request->type;
            $filtered = [
                'period'  => $data['period'],
                'month'   => $data['month'],
                'year'    => $data['year'],
                'summary' => $data['summary'],
            ];

            if ($type === 'kas') {
                $filtered['kas'] = $data['kas'];
            } elseif ($type === 'reservasi') {
                $filtered['reservations'] = $data['reservations'];
            } elseif ($type === 'pengeluaran') {
                $filtered['expenses'] = $data['expenses'];
            }

            return $this->successResponse($filtered, 'Laporan bulanan berhasil diambil.');
        }

        return $this->successResponse($data, 'Laporan bulanan berhasil diambil.');
    }

    /**
     * GET /api/v1/reports/monthly/summary
     * Ringkasan summary bulanan saja
     */
    public function summary(Request $request): JsonResponse
    {
        $month = (int) $request->input('month', now()->month);
        $year  = (int) $request->input('year', now()->year);

        $filters = [];
        if ($request->filled('staff_id')) {
            $filters['staff_id'] = $request->staff_id;
        }

        $summary = $this->reportService->getMonthlySummary($month, $year, $filters);

        return $this->successResponse($summary, 'Ringkasan laporan bulanan berhasil diambil.');
    }

    /**
     * GET /api/v1/reports/monthly/detail
     * Drill-down transaksi per tanggal
     */
    public function detail(Request $request): JsonResponse
    {
        $month = (int) $request->input('month', now()->month);
        $year  = (int) $request->input('year', now()->year);

        if (!$request->filled('date')) {
            return $this->errorResponse('Parameter date wajib diisi.', null, 422);
        }

        $detail = $this->reportService->getMonthlyDetail($month, $year, $request->date);

        return $this->successResponse($detail, 'Detail laporan berhasil diambil.');
    }

    /**
     * GET /api/v1/reports/monthly/export/pdf
     * Generate PDF Monthly Report
     */
    public function exportPdf(Request $request): mixed
    {
        $month = (int) $request->input('month', now()->month);
        $year  = (int) $request->input('year', now()->year);

        $filters = [];
        if ($request->filled('staff_id')) {
            $filters['staff_id'] = $request->staff_id;
        }

        $data = $this->reportService->getMonthlyData($month, $year, $filters);

        $filename = "monthly-report-{$month}-{$year}.pdf";

        return PDF::loadView('pdf.monthly-report', $data)
                  ->download($filename);
    }
}
