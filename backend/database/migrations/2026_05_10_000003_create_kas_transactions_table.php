<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kas_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->string('guest_name', 255);
            $table->string('room_number', 10)->nullable();
            $table->enum('transaction_type', ['reservasi', 'checkin', 'pelunasan']);
            $table->enum('payment_method', ['tunai', 'transfer', 'qris', 'kartu_kredit']);
            $table->decimal('amount', 15, 2);
            $table->text('note')->nullable();
            $table->string('receipt_photo')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kas_transactions');
    }
};
