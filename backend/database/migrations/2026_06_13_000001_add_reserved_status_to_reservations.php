<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ubah enum status reservasi: tambahkan 'reserved' dan ubah default
        DB::statement("ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check");
        DB::statement("ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('reserved', 'checkin', 'checkout', 'cancel', 'noshow'))");
        DB::statement("ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'reserved'");

        // Update existing records: checkin yang belum punya actual check-in → reserved
        // (tidak perlu karena data existing sudah benar checkin)
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check");
        DB::statement("ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('checkin', 'checkout', 'cancel', 'noshow'))");
        DB::statement("ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'checkin'");
    }
};
