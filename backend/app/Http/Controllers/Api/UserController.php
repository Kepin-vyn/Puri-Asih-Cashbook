<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Daftar user belum tersedia.');
    }

    public function store(Request $request): JsonResponse
    {
        return $this->successResponse(null, 'Pembuatan user belum tersedia.', 201);
    }

    public function show(string $id): JsonResponse
    {
        return $this->successResponse(null, 'Detail user belum tersedia.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->successResponse(null, 'Update user belum tersedia.');
    }

    public function destroy(string $id): JsonResponse
    {
        return $this->successResponse(null, 'Hapus user belum tersedia.');
    }

    public function updateRole(Request $request, string $id): JsonResponse
    {
        return $this->successResponse(null, 'Update role user belum tersedia.');
    }

    public function updateShift(Request $request, string $id): JsonResponse
    {
        return $this->successResponse(null, 'Update shift user belum tersedia.');
    }
}
