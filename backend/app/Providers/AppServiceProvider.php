<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set Carbon locale ke Bahasa Indonesia
        // Agar diffForHumans() tampil: "5 menit yang lalu" bukan "5 minutes ago"
        Carbon::setLocale('id');

        // Mock time untuk testing (set via APP_TEST_TIME di .env)
        // Format: Y-m-d H:i:s (contoh: 2026-06-22 08:00:00)
        if ($testTime = env('APP_TEST_TIME')) {
            Carbon::setTestNow(Carbon::parse($testTime));
        }

        // Rate limiter untuk login: maks 5 percobaan per menit per IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.',
                    ], 429);
                });
        });
    }
}
