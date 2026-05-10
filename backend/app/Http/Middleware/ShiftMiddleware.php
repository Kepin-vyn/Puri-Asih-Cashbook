<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ShiftMiddleware
{
    /**
     * Handle an incoming request.
     * Memastikan staff FO memiliki shift aktif sebelum mencatat transaksi.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        // Hanya role 'fo' yang wajib memiliki shift aktif
        if ($user && $user->role === 'fo') {
            $activeShift = DB::table('shifts')
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if (!$activeShift) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada shift aktif',
                ], 403);
            }
        }

        return $next($request);
    }
}
