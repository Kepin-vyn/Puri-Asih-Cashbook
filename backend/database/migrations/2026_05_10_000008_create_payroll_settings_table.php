<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('daily_rate', 15, 2);
            $table->date('effective_date');
            $table->unsignedBigInteger('set_by');
            $table->timestamps();

            $table->foreign('set_by')->references('id')->on('users')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
    }
};
