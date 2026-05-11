<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KasController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\UserController;

// Semua route diakses melalui: http://localhost:8000/api/v1/...
Route::prefix('v1')->group(function () {

    // ============================================
    // PUBLIC ROUTES — Tanpa Autentikasi
    // ============================================
    Route::post('/auth/login', [AuthController::class, 'login']);


    // ============================================
    // PROTECTED ROUTES — Wajib Login (Sanctum)
    // ============================================
    Route::middleware('auth:sanctum')->group(function () {

        // --- Auth ---
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        // --- KAS Harian (FO & Manager) ---
        Route::get('kas/export/pdf',         [KasController::class, 'exportPdf']);   // HARUS sebelum apiResource
        Route::apiResource('kas', KasController::class);
        Route::post('kas/{id}/upload',       [KasController::class, 'upload']);


        // --- Pengeluaran (FO & Manager) ---
        Route::get('expenses/pending/count',   [ExpenseController::class, 'pendingCount']); // HARUS sebelum apiResource
        Route::get('expenses/export/pdf',      [ExpenseController::class, 'exportPdf']);    // HARUS sebelum apiResource
        Route::apiResource('expenses', ExpenseController::class);
        Route::post('expenses/{id}/upload',    [ExpenseController::class, 'upload']);

        // --- Reservasi OTT (FO & Manager) ---
        Route::apiResource('reservations', ReservationController::class);
        Route::put('reservations/{id}/status',      [ReservationController::class, 'updateStatus']);
        Route::get('reservations/{id}/invoice',     [ReservationController::class, 'invoice']);
        Route::get('reservations/availability',     [ReservationController::class, 'availability']);
        Route::get('reservations/export/pdf',       [ReservationController::class, 'exportPdf']);

        // --- Refundable Deposit (FO & Manager) ---
        Route::apiResource('deposits', DepositController::class);
        Route::post('deposits/{id}/refund',   [DepositController::class, 'refund']);
        Route::post('deposits/{id}/forfeit',  [DepositController::class, 'forfeit']);
        Route::get('deposits/expiring',       [DepositController::class, 'expiring']);
        Route::get('deposits/export/pdf',     [DepositController::class, 'exportPdf']);

        // --- Shift & Handover ---
        Route::get('shifts',                   [ShiftController::class, 'index']);
        Route::get('shifts/active',            [ShiftController::class, 'active']);
        Route::post('shifts/start',            [ShiftController::class, 'start']);
        Route::post('shifts/{id}/handover',    [ShiftController::class, 'handover']);
        Route::get('shifts/{id}/summary',      [ShiftController::class, 'summary']);
        Route::get('shifts/{id}/report',       [ShiftController::class, 'report']);
        Route::get('shifts/{id}/report/pdf',   [ShiftController::class, 'reportPdf']);
        Route::get('shifts/daily/{date}',      [ShiftController::class, 'daily']);
        Route::get('shifts/daily/{date}/pdf',  [ShiftController::class, 'dailyPdf']);

        // --- Absensi ---
        Route::get('attendance',                        [AttendanceController::class, 'index']);
        Route::post('attendance/checkin',               [AttendanceController::class, 'checkin']);
        Route::post('attendance/checkout',              [AttendanceController::class, 'checkout']);
        Route::get('attendance/monthly/{staffId}',      [AttendanceController::class, 'monthly']);

        // --- Notifikasi ---
        Route::get('notifications',                [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read',     [NotificationController::class, 'read']);
        Route::get('notifications/unread/count',   [NotificationController::class, 'unreadCount']);


        // ============================================
        // MANAGER ONLY ROUTES — role:manager
        // ============================================
        Route::middleware('role:manager')->group(function () {

            // --- Approval Pengeluaran ---
            Route::post('expenses/{id}/approve', [ExpenseController::class, 'approve']);
            Route::post('expenses/{id}/reject',  [ExpenseController::class, 'reject']);

            // --- Monthly Report ---
            Route::get('reports/monthly',             [ReportController::class, 'monthly']);
            Route::get('reports/monthly/summary',     [ReportController::class, 'summary']);
            Route::get('reports/monthly/export/pdf',  [ReportController::class, 'exportPdf']);
            Route::get('reports/monthly/detail',      [ReportController::class, 'detail']);

            // --- Payroll ---
            Route::get('payroll',                        [PayrollController::class, 'index']);
            Route::get('payroll/{month}',                [PayrollController::class, 'monthly']);
            Route::get('payroll/{month}/{staffId}',      [PayrollController::class, 'detail']);
            Route::post('payroll/calculate/{month}',     [PayrollController::class, 'calculate']);
            Route::get('payroll/{month}/export/pdf',     [PayrollController::class, 'exportPdf']);
            Route::get('payroll/{month}/{staffId}/slip', [PayrollController::class, 'slip']);
            Route::put('payroll/settings/daily-rate',    [PayrollController::class, 'setDailyRate']);

            // --- Absensi: Update Status (Manager Only) ---
            Route::put('attendance/{id}/status', [AttendanceController::class, 'updateStatus']);

            // --- User Management (FO Management) ---
            Route::apiResource('users', UserController::class);
            Route::put('users/{id}/role',  [UserController::class, 'updateRole']);
            Route::put('users/{id}/shift', [UserController::class, 'updateShift']);
        });
    });
});
