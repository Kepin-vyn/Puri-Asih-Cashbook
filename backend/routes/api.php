<?php

use Illuminate\Support\Facades\Route;

// File ini di-load otomatis oleh Laravel dengan prefix URL /api
// Semua route di sini dapat diakses melalui: http://localhost:8000/api/v1/...

Route::prefix('v1')->group(function () {

    // ==========================================
    // PUBLIC ROUTES — Tanpa Auth
    // ==========================================

    // Route::post('/auth/login', [AuthController::class, 'login']);


    // ==========================================
    // PROTECTED ROUTES — Wajib Auth Sanctum
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {

        // --- Auth ---
        // Route::post('/auth/logout', [AuthController::class, 'logout']);
        // Route::get('/auth/me',      [AuthController::class, 'me']);

        // --- Shift Management ---
        // Route::post('/shifts/start',               [ShiftController::class, 'start']);
        // Route::post('/shifts/{id}/handover',       [ShiftController::class, 'handover']);
        // Route::get('/shifts/{id}/report/pdf',      [ShiftController::class, 'reportPdf']);

        // --- Absensi ---
        // Route::post('/attendance/checkin',  [AttendanceController::class, 'checkIn']);
        // Route::post('/attendance/checkout', [AttendanceController::class, 'checkOut']);

        // --- Notifikasi ---
        // Route::get('/notifications', [NotificationController::class, 'index']);


        // ==========================================
        // SHIFT ACTIVE ROUTES — Wajib Shift Aktif (FO)
        // ==========================================
        Route::middleware('shift.active')->group(function () {

            // --- Modul KAS Harian ---
            // Route::apiResource('kas', KasController::class);
            // Route::post('kas/{id}/upload', [KasController::class, 'upload']);
            // Route::get('kas/export/pdf',   [KasController::class, 'exportPdf']);

            // --- Modul Pengeluaran ---
            // Route::apiResource('expenses', ExpenseController::class)->except(['destroy']);

            // --- Modul Reservasi OTT ---
            // Route::apiResource('reservations', ReservationController::class);
            // Route::get('reservations/{id}/invoice', [ReservationController::class, 'invoice']);

            // --- Modul Refundable Deposit ---
            // Route::apiResource('deposits', DepositController::class);
            // Route::post('deposits/{id}/refund', [DepositController::class, 'refund']);
        });


        // ==========================================
        // MANAGER ONLY ROUTES — role:manager
        // ==========================================
        Route::middleware('role:manager')->group(function () {

            // --- Approval Pengeluaran ---
            // Route::post('expenses/{id}/approve', [ExpenseController::class, 'approve']);
            // Route::post('expenses/{id}/reject',  [ExpenseController::class, 'reject']);

            // --- User Management (FO Management) ---
            // Route::apiResource('users', UserController::class);

            // --- Monthly Report ---
            // Route::get('/reports/monthly',            [ReportController::class, 'monthly']);
            // Route::get('/reports/monthly/export/pdf', [ReportController::class, 'monthlyPdf']);

            // --- Payroll ---
            // Route::get('/payroll/{month}',        [PayrollController::class, 'index']);
            // Route::get('/payroll/{month}/{id}/slip', [PayrollController::class, 'slipPdf']);
        });
    });
});
