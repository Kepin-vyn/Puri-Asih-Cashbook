<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class KasTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $transactionTypeLabels = [
            'reservasi' => 'Reservasi',
            'checkin'   => 'Check-In',
            'pelunasan' => 'Pelunasan',
        ];

        $paymentMethodLabels = [
            'tunai'       => 'Tunai',
            'transfer'    => 'Transfer',
            'qris'        => 'QRIS',
            'kartu_kredit' => 'Kartu Kredit',
        ];

        return [
            'id'                    => $this->id,
            'shift_id'              => $this->shift_id,
            'user'                  => [
                'id'   => $this->user?->id,
                'name' => $this->user?->name,
            ],
            'guest_name'            => $this->guest_name,
            'room_number'           => $this->room_number,
            'transaction_type'      => $this->transaction_type,
            'transaction_type_label' => $transactionTypeLabels[$this->transaction_type] ?? $this->transaction_type,
            'payment_method'        => $this->payment_method,
            'payment_method_label'  => $paymentMethodLabels[$this->payment_method] ?? $this->payment_method,
            'amount'                => (int) $this->amount,
            'amount_formatted'      => 'Rp ' . number_format($this->amount, 0, ',', '.'),
            'note'                  => $this->note,
            'receipt_photo_url'     => $this->receipt_photo
                                        ? Storage::disk('public')->url($this->receipt_photo)
                                        : null,
            'created_at'            => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
