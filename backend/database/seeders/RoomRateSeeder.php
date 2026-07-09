<?php

namespace Database\Seeders;

use App\Models\RoomRate;
use Illuminate\Database\Seeder;

class RoomRateSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = [];
        for ($i = 101; $i <= 110; $i++) {
            $rooms[] = (string) $i;
        }
        for ($i = 201; $i <= 210; $i++) {
            $rooms[] = (string) $i;
        }
        for ($i = 301; $i <= 310; $i++) {
            $rooms[] = (string) $i;
        }

        foreach ($rooms as $room) {
            RoomRate::firstOrCreate(
                ['room_number' => $room],
                ['price_per_night' => 350000]
            );
        }
    }
}
