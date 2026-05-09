<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BaseApiController extends Controller
{
    /**
     * Response sukses standar.
     */
    protected function successResponse($data = null, string $message = 'Success', ?array $meta = null, int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if (!is_null($data)) {
            $response['data'] = $data;
        }

        if (!is_null($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Response error validasi (422) atau error umum.
     */
    protected function errorResponse(string $message = 'Data tidak valid', $errors = null, int $statusCode = 422): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Response data tidak ditemukan (404).
     */
    protected function notFoundResponse(string $message = 'Data tidak ditemukan'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    /**
     * Response akses ditolak (403).
     */
    protected function forbiddenResponse(string $message = 'Akses ditolak'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }

    /**
     * Response sukses dengan paginasi.
     */
    protected function paginatedResponse($paginator, string $message = 'Success'): JsonResponse
    {
        return $this->successResponse(
            data: $paginator->items(),
            message: $message,
            meta: [
                'page'     => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total'    => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }
}
