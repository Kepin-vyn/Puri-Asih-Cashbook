<?php

use App\Console\Commands\NotifyExpiringDeposits;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jalankan notifikasi deposit expiring setiap hari jam 07:00 pagi
Schedule::command('deposits:notify-expiring')->dailyAt('07:00');
