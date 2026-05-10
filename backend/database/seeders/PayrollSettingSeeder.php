<?php

namespace Database\Seeders;

use App\Models\PayrollSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PayrollSettingSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil ID Manager yang sudah dibuat oleh UserSeeder
        $manager = User::where('email', 'manager@puriasih.com')->first();

        PayrollSetting::create([
            'daily_rate'     => 150000.00,
            'effective_date' => Carbon::today(),
            'set_by'         => $manager->id,
        ]);
    }
}
