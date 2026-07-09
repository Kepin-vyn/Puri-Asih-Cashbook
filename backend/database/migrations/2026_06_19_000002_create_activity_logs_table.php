<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->string('module');           // reservation, kas, deposit, expense, shift, attendance
            $table->string('action');           // create, update, delete, checkin, checkout, refund, forfeit, handover
            $table->string('description');      // Human-readable description
            $table->json('meta')->nullable();   // Additional context (amounts, status changes, etc.)
            $table->timestamp('created_at')->useCurrent();

            $table->index(['module', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['shift_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
