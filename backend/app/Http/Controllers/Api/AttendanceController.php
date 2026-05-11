<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends BaseApiController
{
    public function index(Request $request): JsonResponse { return $this->successResponse([], 'Feature coming soon.'); }
    public function checkin(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.', 201); }
    public function checkout(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function monthly(string $staffId): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
}
