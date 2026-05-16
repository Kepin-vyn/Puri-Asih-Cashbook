<?php

namespace App\Services;

use App\Models\KasTransaction;
use App\Models\Reservation;

class KasAutomationService
{
    /**
     * Buat transaksi KAS otomatis dari Reservasi.
     * Digunakan saat reservasi baru (down_payment) dan check-in (remaining_balance).
     */
    public function createFromReservation(
        Reservation $reservation,
        string $transactionType,
        float $amount
    ): KasTransaction {
        return KasTransaction::create([
            'shift_id'         => $reservation->shift_id,
            'user_id'          => $reservation->user_id,
            'guest_name'       => $reservation->guest_name,
            'room_number'      => $reservation->room_number,
            'transaction_type' => $transactionType,
            'payment_method'   => $reservation->payment_method,
            'amount'           => $amount,
            'note'             => 'Otomatis dari Reservasi #' . $reservation->invoice_number,
            'auto_generated'   => true,
            'source_reference' => 'reservation:' . $reservation->invoice_number,
        ]);
    }
}
