<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statusLabels = [
            'auto_approved' => 'Auto Approved',
            'pending'       => 'Menunggu',
            'approved'      => 'Disetujui',
            'rejected'      => 'Ditolak',
        ];

        $paymentMethodLabels = [
            'tunai'        => 'Tunai',
            'transfer'     => 'Transfer',
            'qris'         => 'QRIS',
            'kartu_kredit' => 'Kartu Kredit',
        ];

        return [
            'id'                 => $this->id,
            'shift_id'           => $this->shift_id,
            'user'               => [
                'id'   => $this->user?->id,
                'name' => $this->user?->name,
            ],
            'description'        => $this->description,
            'price_per_item'     => (int) $this->price_per_item,
            'quantity'           => (int) $this->quantity,
            'total_price'        => (int) $this->total_price,
            'total_price_formatted' => 'Rp ' . number_format($this->total_price, 0, ',', '.'),
            'payment_method'     => $this->payment_method,
            'payment_method_label' => $paymentMethodLabels[$this->payment_method] ?? $this->payment_method,
            'status'             => $this->status,
            'status_label'       => $statusLabels[$this->status] ?? $this->status,
            'approved_by'        => [
                'id'   => $this->approvedBy?->id,
                'name' => $this->approvedBy?->name,
            ],
            'approved_at'        => $this->approved_at?->format('d/m/Y H:i'),
            'rejection_reason'   => $this->rejection_reason,
            'receipt_photo_url'  => $this->receipt_photo
                                        ? Storage::disk('public')->url($this->receipt_photo)
                                        : null,
            'created_at'         => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
