<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PayrollController extends BaseApiController
{
    public function index(): JsonResponse
    {
        return $this->successResponse([], 'Data payroll belum tersedia.');
    }

    public function monthly(string $month): JsonResponse
    {
        return $this->successResponse([], 'Data payroll bulanan belum tersedia.');
    }

    public function detail(string $month, string $staffId): JsonResponse
    {
        return $this->successResponse([], 'Detail payroll belum tersedia.');
    }

    public function calculate(string $month): JsonResponse
    {
        return $this->successResponse(null, 'Perhitungan payroll belum tersedia.');
    }

    public function exportPdf(string $month): JsonResponse
    {
        return $this->successResponse(null, 'Ekspor slip payroll belum tersedia.');
    }

    public function slip(string $month, string $staffId): JsonResponse
    {
        return $this->successResponse(null, 'Slip payroll belum tersedia.');
    }

    public function setDailyRate(Request $request): JsonResponse
    {
        return $this->successResponse(null, 'Pengaturan tarif harian belum tersedia.');
    }
}
