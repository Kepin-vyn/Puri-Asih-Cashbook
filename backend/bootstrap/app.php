<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\ShiftMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Mendaftarkan alias middleware custom
        $middleware->alias([
            'role'         => RoleMiddleware::class,
            'shift.active' => ShiftMiddleware::class,
        ]);

        // Mengaktifkan stateful API untuk Sanctum (komunikasi dengan React dev server)
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle 404 Not Found dengan format JSON standar
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak ditemukan.',
                ], 404);
            }
        });

        // Handle 401 Unauthenticated dengan format JSON standar
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda belum login atau sesi telah berakhir.',
                ], 401);
            }
        });
    })->create();
