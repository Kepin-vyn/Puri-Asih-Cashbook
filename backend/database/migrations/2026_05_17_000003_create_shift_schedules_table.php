<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('restrict');

            // Selalu hari Senin dari minggu tersebut
            $table->date('week_start_date');

            // Jadwal per hari
            $table->enum('monday',    ['pagi', 'siang', 'malam', 'off'])->default('off');
            $table->enum('tuesday',   ['pagi', 'siang', 'malam', 'off'])->default('off');
            $table->enum('wednesday', ['pagi', 'siang', 'malam', 'off'])->default('off');
            $table->enum('thursday',  ['pagi', 'siang', 'malam', 'off'])->default('off');
            $table->enum('friday',    ['pagi', 'siang', 'malam', 'off'])->default('off');
            $table->enum('saturday',  ['pagi', 'siang', 'malam', 'off'])->default('off');
            $table->enum('sunday',    ['pagi', 'siang', 'malam', 'off'])->default('off');

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->onDelete('restrict');

            $table->timestamps();

            // Satu user hanya boleh punya satu jadwal per minggu
            $table->unique(['user_id', 'week_start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_schedules');
    }
};
