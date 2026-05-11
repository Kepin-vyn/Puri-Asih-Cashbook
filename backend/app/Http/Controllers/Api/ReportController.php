<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends BaseApiController
{
    public function monthly(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Laporan bulanan belum tersedia.');
    }

    public function summary(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Ringkasan laporan belum tersedia.');
    }

    public function exportPdf(Request $request): JsonResponse
    {
        return $this->successResponse(null, 'Ekspor PDF laporan belum tersedia.');
    }

    public function detail(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Detail laporan belum tersedia.');
    }
}
