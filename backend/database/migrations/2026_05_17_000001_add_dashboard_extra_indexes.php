<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Index untuk Expense per shift + status (dashboard FO query)
        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['shift_id', 'status'], 'expenses_shift_status_idx');
        });

        // Index untuk Reservasi per shift + status dan status + created_at
        Schema::table('reservations', function (Blueprint $table) {
            $table->index(['shift_id', 'status'], 'reservations_shift_status_idx');
            $table->index(['status', 'created_at'], 'reservations_status_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('expenses_shift_status_idx');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex('reservations_shift_status_idx');
            $table->dropIndex('reservations_status_date_idx');
        });
    }
};
