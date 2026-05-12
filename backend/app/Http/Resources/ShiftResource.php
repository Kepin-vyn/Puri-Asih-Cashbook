<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $typeLabels = [
            'pagi'  => 'Pagi',
            'siang' => 'Siang',
            'malam' => 'Malam',
        ];

        $statusLabels = [
            'active' => 'Aktif',
            'closed' => 'Ditutup',
        ];

        // Hitung durasi dalam menit
        $duration = null;
        if ($this->started_at && $this->ended_at) {
            $duration = (int) $this->started_at->diffInMinutes($this->ended_at);
        }

        $data = [
            'id'   => $this->id,
            'user' => [
                'id'    => $this->user?->id,
                'name'  => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'type'         => $this->type,
            'type_label'   => $typeLabels[$this->type] ?? $this->type,
            'started_at'   => $this->started_at?->format('d/m/Y H:i'),
            'ended_at'     => $this->ended_at?->format('d/m/Y H:i'),
            'handover_to'  => $this->handoverUser ? [
                'id'   => $this->handoverUser->id,
                'name' => $this->handoverUser->name,
            ] : null,
            'handover_note' => $this->handover_note,
            'status'        => $this->status,
            'status_label'  => $statusLabels[$this->status] ?? $this->status,
            'duration'      => $duration,
            'created_at'    => $this->created_at?->format('d/m/Y H:i'),
        ];

        // Include summary jika sudah di-load (via additional)
        if (isset($this->additional['summary'])) {
            $data['summary'] = $this->additional['summary'];
        } elseif ($this->resource->relationLoaded('kasTransactions')) {
            // Jika relasi sudah eager-loaded, bisa dihitung langsung
            // Tapi biasanya kita pakai additional
        }

        return $data;
    }
}
