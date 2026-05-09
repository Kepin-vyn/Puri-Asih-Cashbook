<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ShiftMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Middleware ini memastikan FO hanya bisa mengakses
     * modul transaksi jika memiliki shift yang sedang aktif.
     * Manager dibebaskan dari pengecekan ini.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Manager tidak perlu shift aktif
        if ($user->role === 'manager') {
            return $next($request);
        }

        // Cek shift aktif untuk FO
        // Relasi activeShift akan dibuat di Issue #4 (Database Migration)
        $hasActiveShift = $user->shifts()
            ->where('status', 'active')
            ->exists();

        if (!$hasActiveShift) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada shift aktif. Silakan mulai shift terlebih dahulu.',
            ], 403);
        }

        return $next($request);
    }
}
