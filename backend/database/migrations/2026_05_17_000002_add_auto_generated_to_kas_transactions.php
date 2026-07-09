<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kas_transactions', function (Blueprint $table) {
            $table->boolean('auto_generated')->default(false)->after('note');
            $table->string('source_reference')->nullable()->after('auto_generated');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kas_transactions', function (Blueprint $table) {
            $table->dropColumn(['auto_generated', 'source_reference']);
        });
    }
};
