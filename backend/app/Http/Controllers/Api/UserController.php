<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseApiController
{
    public function index(Request $request): JsonResponse { return $this->successResponse([], 'Feature coming soon.'); }
    public function store(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.', 201); }
    public function show(string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function update(Request $request, string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function destroy(string $id): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
}
