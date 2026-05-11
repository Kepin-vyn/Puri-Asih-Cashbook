<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $sourceLabels = [
            'walk_in' => 'Walk In',
            'tiket'   => 'Tiket.com',
            'booking' => 'Booking.com',
        ];

        $statusLabels = [
            'checkin'  => 'Check-In',
            'checkout' => 'Check-Out',
            'cancel'   => 'Dibatalkan',
            'noshow'   => 'No Show',
        ];

        $paymentMethodLabels = [
            'tunai'        => 'Tunai',
            'transfer'     => 'Transfer',
            'qris'         => 'QRIS',
            'kartu_kredit' => 'Kartu Kredit',
        ];

        $paymentStatusLabels = [
            'dp'    => 'Down Payment',
            'lunas' => 'Lunas',
        ];

        return [
            'id'                        => $this->id,
            'invoice_number'            => $this->invoice_number,
            'shift_id'                  => $this->shift_id,
            'user'                      => [
                'id'   => $this->user?->id,
                'name' => $this->user?->name,
            ],
            'guest_name'                => $this->guest_name,
            'room_number'               => $this->room_number,
            'reservation_date'          => $this->reservation_date
                                            ? \Carbon\Carbon::parse($this->reservation_date)->format('d/m/Y')
                                            : null,
            'check_in_date'             => $this->check_in_date
                                            ? \Carbon\Carbon::parse($this->check_in_date)->format('d/m/Y')
                                            : null,
            'check_out_date'            => $this->check_out_date
                                            ? \Carbon\Carbon::parse($this->check_out_date)->format('d/m/Y')
                                            : null,
            'room_price'                => (int) $this->room_price,
            'room_price_formatted'      => 'Rp ' . number_format($this->room_price, 0, ',', '.'),
            'down_payment'              => (int) $this->down_payment,
            'down_payment_formatted'    => 'Rp ' . number_format($this->down_payment, 0, ',', '.'),
            'remaining_balance'         => (int) $this->remaining_balance,
            'remaining_balance_formatted' => 'Rp ' . number_format($this->remaining_balance, 0, ',', '.'),
            'payment_method'            => $this->payment_method,
            'payment_method_label'      => $paymentMethodLabels[$this->payment_method] ?? $this->payment_method,
            'payment_status'            => $this->payment_status,
            'payment_status_label'      => $paymentStatusLabels[$this->payment_status] ?? $this->payment_status,
            'source'                    => $this->source,
            'source_label'              => $sourceLabels[$this->source] ?? $this->source,
            'status'                    => $this->status,
            'status_label'              => $statusLabels[$this->status] ?? $this->status,
            'remarks'                   => $this->remarks,
            'created_at'                => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
