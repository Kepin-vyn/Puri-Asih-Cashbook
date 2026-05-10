<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->onDelete('restrict');
            $table->enum('shift_type', ['pagi', 'siang', 'malam']);
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();
            $table->enum('status', ['hadir', 'libur', 'sakit', 'izin', 'alpha'])->default('hadir');
            $table->boolean('is_late')->default(false);
            $table->text('digital_signature')->nullable();
            // Menggunakan 'attendance_date' karena 'date' adalah reserved word di PostgreSQL
            $table->date('attendance_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
