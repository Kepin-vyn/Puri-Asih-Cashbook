<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\User;

class NotificationHelper
{
    /**
     * Kirim notifikasi ke semua user dengan role 'manager'
     */
    public static function sendToManagers(string $type, string $title, string $message, array $data = []): int
    {
        $managers = User::where('role', 'manager')->get();
        $count = 0;

        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type'    => $type,
                'title'   => $title,
                'message' => $message,
                'data'    => $data,
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Kirim notifikasi ke semua user dengan role 'fo' dan status 'active'
     */
    public static function sendToFoStaff(string $type, string $title, string $message, array $data = []): int
    {
        $foUsers = User::where('role', 'fo')
            ->where('status', 'active')
            ->get();
        $count = 0;

        foreach ($foUsers as $fo) {
            Notification::create([
                'user_id' => $fo->id,
                'type'    => $type,
                'title'   => $title,
                'message' => $message,
                'data'    => $data,
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Kirim notifikasi ke user tertentu
     */
    public static function sendToUser(int $userId, string $type, string $title, string $message, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'data'    => $data,
        ]);
    }
}
