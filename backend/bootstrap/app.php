<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Alias middleware custom
        $middleware->alias([
            'role'         => \App\Http\Middleware\RoleMiddleware::class,
            'shift.active' => \App\Http\Middleware\ShiftMiddleware::class,
        ]);

        // Aktifkan Sanctum stateful API (untuk SPA)
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Global handler: Unauthenticated → JSON 401
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Silakan login terlebih dahulu.',
                ], 401);
            }
        });

        // Global handler: Route tidak ditemukan → JSON 404
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource tidak ditemukan.',
                ], 404);
            }
        });
    })->create();
