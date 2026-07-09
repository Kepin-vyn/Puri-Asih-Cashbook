<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Shift;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Catat aktivitas ke activity_logs.
     */
    public function log(
        string $module,
        string $action,
        string $description,
        ?array $meta = null,
        ?int $userId = null,
        ?int $shiftId = null
    ): ActivityLog {
        // Auto-detect shift aktif jika tidak diberikan
        if ($shiftId === null) {
            $uid = $userId ?? Auth::id();
            $activeShift = Shift::where('user_id', $uid)
                ->where('status', 'active')
                ->value('id');
            $shiftId = $activeShift;
        }

        return ActivityLog::create([
            'user_id' => $userId ?? Auth::id(),
            'shift_id' => $shiftId,
            'module' => $module,
            'action' => $action,
            'description' => $description,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }
}
