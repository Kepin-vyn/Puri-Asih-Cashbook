<?php

namespace App\Providers;

use Carbon\Carbon;
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
    }
}
