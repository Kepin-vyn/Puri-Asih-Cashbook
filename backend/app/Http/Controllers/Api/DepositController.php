<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepositController extends BaseApiController
{
    public function index(Request $request): JsonResponse { return $this->successResponse([], 'Feature coming soon.'); }
    public function store(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.', 201); }
    public function show(string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function update(Request $request, string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function destroy(string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function refund(string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function forfeit(Request $request, string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function expiring(): JsonResponse { return $this->successResponse([], 'Feature coming soon.'); }
    public function exportPdf(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
}
