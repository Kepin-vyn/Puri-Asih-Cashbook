<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->string('guest_name', 255);
            $table->string('room_number', 10);
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['tunai', 'transfer', 'qris', 'kartu_kredit']);
            $table->enum('status', ['active', 'refunded', 'forfeited'])->default('active');
            $table->date('refund_date')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
