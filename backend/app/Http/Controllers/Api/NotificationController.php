<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class NotificationController extends BaseApiController
{
    /**
     * GET /api/v1/notifications
     * Return notifikasi milik user yang login
     * Urutkan: unread dulu, lalu terbaru
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderByRaw('CASE WHEN read_at IS NULL THEN 0 ELSE 1 END ASC')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return $this->successResponse(
            NotificationResource::collection($notifications),
            'Data notifikasi berhasil diambil.'
        );
    }

    /**
     * POST /api/v1/notifications/{id}/read
     * Mark notifikasi sebagai sudah dibaca
     */
    public function read(string $id): JsonResponse
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return $this->notFoundResponse('Notifikasi tidak ditemukan.');
        }

        // Validasi: harus milik user yang login
        if ($notification->user_id !== Auth::id()) {
            return $this->forbiddenResponse('Akses ditolak.');
        }

        $notification->update([
            'read_at' => Carbon::now(),
        ]);

        return $this->successResponse(
            new NotificationResource($notification),
            'Notifikasi berhasil ditandai sudah dibaca.'
        );
    }

    /**
     * GET /api/v1/notifications/unread/count
     * Return jumlah notifikasi belum dibaca
     */
    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', Auth::id())
            ->unread()
            ->count();

        return $this->successResponse(
            ['count' => $count],
            'Jumlah notifikasi belum dibaca berhasil diambil.'
        );
    }
}
