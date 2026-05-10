<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Manager
        User::firstOrCreate(
            ['email' => 'manager@puriasih.com'],
            [
                'name'     => 'Manager',
                'password' => Hash::make('manager123'),
                'role'     => 'manager',
                'shift'    => null,
                'status'   => 'active',
            ]
        );

        // FO 1 — Shift Pagi
        User::firstOrCreate(
            ['email' => 'kevin@puriasih.com'],
            [
                'name'     => 'Kevin',
                'password' => Hash::make('fo123'),
                'role'     => 'fo',
                'shift'    => 'pagi',
                'status'   => 'active',
            ]
        );

        // FO 2 — Shift Siang
        User::firstOrCreate(
            ['email' => 'awan@puriasih.com'],
            [
                'name'     => 'Awan',
                'password' => Hash::make('fo123'),
                'role'     => 'fo',
                'shift'    => 'siang',
                'status'   => 'active',
            ]
        );
    }
}
