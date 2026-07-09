<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah 'parkir' ke constraint transaction_type
        DB::statement('ALTER TABLE kas_transactions DROP CONSTRAINT IF EXISTS kas_transactions_transaction_type_check');
        DB::statement("ALTER TABLE kas_transactions ADD CONSTRAINT kas_transactions_transaction_type_check CHECK (transaction_type IN ('reservasi', 'checkin', 'pelunasan', 'deposit_hangus', 'parkir'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE kas_transactions DROP CONSTRAINT IF EXISTS kas_transactions_transaction_type_check');
        DB::statement("ALTER TABLE kas_transactions ADD CONSTRAINT kas_transactions_transaction_type_check CHECK (transaction_type IN ('reservasi', 'checkin', 'pelunasan', 'deposit_hangus'))");
    }
};
