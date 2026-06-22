<?php

namespace App\Http\Controllers\Api;

use App\Models\RoomRate;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoomRateController extends BaseApiController
{
    /**
     * GET /api/v1/room-rates
     * Ambil semua tarif kamar (semua role bisa baca)
     */
    public function index(): JsonResponse
    {
        $rates = RoomRate::orderBy('room_number')->get();

        return $this->successResponse($rates, 'Tarif kamar berhasil diambil.');
    }

    /**
     * PUT /api/v1/room-rates/{roomNumber}
     * Update tarif kamar tertentu (manager only)
     */
    public function update(Request $request, string $roomNumber): JsonResponse
    {
        $request->validate([
            'price_per_night' => 'required|numeric|min:0',
        ]);

        $rate = RoomRate::firstOrCreate(
            ['room_number' => $roomNumber],
            ['price_per_night' => 0, 'updated_by' => Auth::id()]
        );

        $rate->update([
            'price_per_night' => $request->price_per_night,
            'updated_by'      => Auth::id(),
        ]);

        return $this->successResponse($rate->fresh(), "Tarif kamar {$roomNumber} berhasil diperbarui.");
    }

    /**
     * PUT /api/v1/room-rates/bulk
     * Update tarif banyak kamar sekaligus (manager only)
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'rates'   => 'required|array',
            'rates.*.room_number'     => 'required|string',
            'rates.*.price_per_night' => 'required|numeric|min:0',
        ]);

        $userId = Auth::id();

        foreach ($request->rates as $item) {
            RoomRate::updateOrCreate(
                ['room_number' => $item['room_number']],
                ['price_per_night' => $item['price_per_night'], 'updated_by' => $userId]
            );
        }

        $rates = RoomRate::orderBy('room_number')->get();

        return $this->successResponse($rates, 'Tarif kamar berhasil diperbarui.');
    }

    /**
     * GET /api/v1/room-rates/calculate
     * Hitung harga otomatis: price_per_night × jumlah malam
     */
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'room_number'    => 'required|string',
            'check_in_date'  => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date',
        ]);

        $rate = RoomRate::where('room_number', $request->room_number)->first();

        if (!$rate) {
            return $this->successResponse([
                'price_per_night' => 0,
                'nights'          => 0,
                'total_price'     => 0,
                'has_rate'        => false,
            ], 'Tarif kamar belum diatur.');
        }

        $checkIn  = Carbon::parse($request->check_in_date);
        $checkOut = Carbon::parse($request->check_out_date);
        $nights   = $checkIn->diffInDays($checkOut);
        $total    = (float) $rate->price_per_night * $nights;

        return $this->successResponse([
            'price_per_night' => (float) $rate->price_per_night,
            'nights'          => $nights,
            'total_price'     => $total,
            'has_rate'        => true,
        ], 'Harga berhasil dihitung.');
    }
}
