<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Notifikasi belum tersedia.');
    }

    public function read(string $id): JsonResponse
    {
        return $this->successResponse(null, 'Tandai notifikasi sudah dibaca belum tersedia.');
    }

    public function unreadCount(): JsonResponse
    {
        return $this->successResponse(['count' => 0], 'Jumlah notifikasi belum dibaca belum tersedia.');
    }
}
