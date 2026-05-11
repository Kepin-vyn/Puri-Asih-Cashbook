<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Data attendance belum tersedia.');
    }

    public function checkin(Request $request): JsonResponse
    {
        return $this->successResponse(null, 'Fitur checkin belum tersedia.', 201);
    }

    public function checkout(Request $request): JsonResponse
    {
        return $this->successResponse(null, 'Fitur checkout belum tersedia.', 201);
    }

    public function monthly(string $staffId): JsonResponse
    {
        return $this->successResponse([], 'Laporan absensi bulanan belum tersedia.');
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        return $this->successResponse(null, 'Update status absensi belum tersedia.');
    }
}
