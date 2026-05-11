<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BaseApiController extends Controller
{
    /**
     * Return a standard success response.
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'Success',
        int $statusCode = 200,
        ?array $meta = null
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $statusCode);
    }


    /**
     * Return a standard error response.
     */
    protected function errorResponse(
        string $message = 'Error',
        mixed $errors = null,
        int $statusCode = 400
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a standard 404 Not Found response.
     */
    protected function notFoundResponse(string $message = 'Resource tidak ditemukan'): JsonResponse
    {
        return $this->errorResponse($message, null, 404);
    }

    /**
     * Return a standard 403 Forbidden response.
     */
    protected function forbiddenResponse(string $message = 'Akses ditolak'): JsonResponse
    {
        return $this->errorResponse($message, null, 403);
    }
}
