<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepositResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statusLabels = [
            'active'    => 'Aktif',
            'refunded'  => 'Dikembalikan',
            'forfeited' => 'Hangus',
        ];

        $paymentMethodLabels = [
            'tunai'        => 'Tunai',
            'transfer'     => 'Transfer',
            'qris'         => 'QRIS',
            'kartu_kredit' => 'Kartu Kredit',
        ];

        // Cek apakah deposit akan jatuh tempo <= besok dan masih active
        $isExpiringSoon = false;
        if ($this->status === 'active' && $this->check_out_date) {
            $checkOutDate = Carbon::parse($this->check_out_date)->startOfDay();
            $tomorrow     = Carbon::tomorrow()->startOfDay();
            $isExpiringSoon = $checkOutDate->lte($tomorrow);
        }

        return [
            'id'               => $this->id,
            'shift_id'         => $this->shift_id,
            'user'             => [
                'id'   => $this->user?->id,
                'name' => $this->user?->name,
            ],
            'guest_name'       => $this->guest_name,
            'room_number'      => $this->room_number,
            'check_in_date'    => $this->check_in_date
                                    ? Carbon::parse($this->check_in_date)->format('d/m/Y')
                                    : null,
            'check_out_date'   => $this->check_out_date
                                    ? Carbon::parse($this->check_out_date)->format('d/m/Y')
                                    : null,
            'amount'           => (int) $this->amount,
            'amount_formatted' => 'Rp ' . number_format($this->amount, 0, ',', '.'),
            'payment_method'   => $this->payment_method,
            'payment_method_label' => $paymentMethodLabels[$this->payment_method] ?? $this->payment_method,
            'status'           => $this->status,
            'status_label'     => $statusLabels[$this->status] ?? $this->status,
            'refund_date'      => $this->refund_date
                                    ? Carbon::parse($this->refund_date)->format('d/m/Y')
                                    : null,
            'note'             => $this->note,
            'is_expiring_soon' => $isExpiringSoon,
            'created_at'       => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
