<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Urutan PENTING: User harus dibuat dulu
        // sebelum PayrollSetting (karena butuh user ID Manager)
        $this->call([
            UserSeeder::class,
            PayrollSettingSeeder::class,
        ]);
    }
}
