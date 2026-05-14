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
        Schema::table('shifts', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });

        Schema::table('kas_transactions', function (Blueprint $table) {
            $table->index(['shift_id', 'created_at']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['status', 'created_at']);
        });

        Schema::table('deposits', function (Blueprint $table) {
            $table->index(['status', 'check_out_date']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'read_at', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });

        Schema::table('kas_transactions', function (Blueprint $table) {
            $table->dropIndex(['shift_id', 'created_at']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
        });

        Schema::table('deposits', function (Blueprint $table) {
            $table->dropIndex(['status', 'check_out_date']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'read_at', 'created_at']);
        });
    }
};
