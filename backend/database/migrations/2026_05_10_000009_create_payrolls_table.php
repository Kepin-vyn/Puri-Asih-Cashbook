<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            // Menggunakan smallInteger karena PostgreSQL tidak punya tinyInteger/year
            $table->smallInteger('month');
            $table->smallInteger('year');
            $table->integer('total_present')->default(0);
            $table->integer('total_leave')->default(0);
            $table->integer('total_absent')->default(0);
            $table->decimal('daily_rate', 15, 2);
            $table->decimal('total_salary', 15, 2);
            $table->timestamps();

            // Pastikan tidak ada duplikasi gaji per user per bulan per tahun
            $table->unique(['user_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
