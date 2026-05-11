<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return $this->successResponse($notifications, 'Notifikasi berhasil diambil.');
    }

    public function read(string $id): JsonResponse
    {
        $notif = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $notif) {
            return $this->notFoundResponse('Notifikasi tidak ditemukan.');
        }

        $notif->update(['read_at' => now()]);

        return $this->successResponse($notif, 'Notifikasi ditandai sudah dibaca.');
    }

    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return $this->successResponse(['count' => $count], 'Jumlah notifikasi belum dibaca.');
    }
}
