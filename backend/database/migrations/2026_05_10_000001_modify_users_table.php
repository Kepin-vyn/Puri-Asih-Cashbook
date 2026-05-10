<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['fo', 'manager'])->default('fo')->after('email');
            $table->enum('shift', ['pagi', 'siang', 'malam'])->nullable()->after('role');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('shift');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'shift', 'status']);
            $table->dropSoftDeletes();
        });
    }
};
