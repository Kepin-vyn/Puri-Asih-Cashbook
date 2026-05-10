<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->string('guest_name', 255);
            $table->string('room_number', 10);
            $table->date('reservation_date');
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->decimal('room_price', 15, 2);
            $table->decimal('down_payment', 15, 2)->default(0);
            $table->decimal('remaining_balance', 15, 2);
            $table->enum('payment_method', ['tunai', 'transfer', 'qris', 'kartu_kredit']);
            $table->enum('payment_status', ['dp', 'lunas'])->default('dp');
            $table->enum('source', ['walk_in', 'tiket', 'booking'])->default('walk_in');
            $table->enum('status', ['checkin', 'checkout', 'cancel', 'noshow'])->default('checkin');
            $table->string('invoice_number', 50)->unique();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
