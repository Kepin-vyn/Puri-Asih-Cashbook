<?php

namespace App\Services;

use App\Models\Reservation;
use Carbon\Carbon;

class ReservationService
{
    /**
     * Daftar semua nomor kamar yang tersedia di hotel
     */
    private array $allRooms;

    public function __construct()
    {
        $rooms = [];
        // Lantai 1: 101-110
        for ($i = 101; $i <= 110; $i++) {
            $rooms[] = (string) $i;
        }
        // Lantai 2: 201-210
        for ($i = 201; $i <= 210; $i++) {
            $rooms[] = (string) $i;
        }
        // Lantai 3: 301-310
        for ($i = 301; $i <= 310; $i++) {
            $rooms[] = (string) $i;
        }
        $this->allRooms = $rooms;
    }

    /**
     * Generate invoice number unik dengan format: INV-YYYYMMDD-XXXX
     * XXXX adalah counter 4-digit yang auto-increment per hari
     */
    public function generateInvoiceNumber(): string
    {
        $today  = Carbon::today()->format('Ymd');
        $prefix = "INV-{$today}-";

        // Cari nomor invoice terakhir hari ini
        $last = Reservation::where('invoice_number', 'like', $prefix . '%')
                           ->orderBy('invoice_number', 'desc')
                           ->value('invoice_number');

        if ($last) {
            // Ambil 4 digit terakhir dan increment
            $lastNumber = (int) substr($last, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Hitung sisa tagihan (remaining balance)
     */
    public function calculateRemainingBalance(float $roomPrice, float $downPayment): float
    {
        return max(0, $roomPrice - $downPayment);
    }

    /**
     * Ambil daftar kamar yang tersedia pada rentang tanggal tertentu
     */
    public function getAvailableRooms(string $checkIn, string $checkOut): array
    {
        // Kamar yang sudah dipesan dan bentrok dengan rentang tanggal ini
        // (tidak cancel dan tidak noshow)
        $bookedRooms = Reservation::whereNotIn('status', ['cancel', 'noshow'])
            ->where(function ($query) use ($checkIn, $checkOut) {
                // Overlap: reservasi yang check-in sebelum tanggal checkout kita
                // DAN check-out setelah tanggal check-in kita
                $query->where('check_in_date', '<', $checkOut)
                      ->where('check_out_date', '>', $checkIn);
            })
            ->pluck('room_number')
            ->toArray();

        // Filter kamar yang tidak ada di daftar terpesan
        $availableRooms = array_values(
            array_diff($this->allRooms, $bookedRooms)
        );

        return $availableRooms;
    }

    /**
     * Ambil semua kamar yang dimiliki hotel
     */
    public function getAllRooms(): array
    {
        return $this->allRooms;
    }
}
