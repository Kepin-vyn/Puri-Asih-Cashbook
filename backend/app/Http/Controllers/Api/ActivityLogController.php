<?php

namespace App\Http\Controllers\Api;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends BaseApiController
{
    /**
     * GET /api/v1/activity-logs
     * Manager: semua aktivitas, support filter
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with(['user:id,name,role,shift'])
            ->orderBy('created_at', 'desc');

        // Filter by date range
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Filter by module
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filter by user_id
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by shift_id
        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->shift_id);
        }

        // Search in description
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $logs = $query->paginate($request->get('per_page', 50));

        return $this->successResponse(
            $logs->items(),
            'Data activity log berhasil diambil.',
            200,
            [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ]
        );
    }

    /**
     * GET /api/v1/activity-logs/modules
     * List available modules for filter
     */
    public function modules(): JsonResponse
    {
        $modules = ActivityLog::select('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module')
            ->toArray();

        return $this->successResponse($modules, 'Daftar modul berhasil diambil.');
    }

    /**
     * GET /api/v1/activity-logs/shifts
     * List shifts for filter (recent shifts)
     */
    public function shifts(): JsonResponse
    {
        $shifts = ActivityLog::select('shift_id')
            ->whereNotNull('shift_id')
            ->distinct()
            ->with('shift:id,started_at,type,status,user_id')
            ->get()
            ->map(fn($log) => $log->shift)
            ->filter()
            ->unique('id')
            ->values()
            ->toArray();

        return $this->successResponse($shifts, 'Daftar shift berhasil diambil.');
    }
}
