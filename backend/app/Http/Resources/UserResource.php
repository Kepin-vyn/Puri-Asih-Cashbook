<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $roleLabels = [
            'fo'      => 'Front Office',
            'manager' => 'Manager',
        ];

        $shiftLabels = [
            'pagi'  => 'Pagi',
            'siang' => 'Siang',
            'malam' => 'Malam',
        ];

        $statusLabels = [
            'active'   => 'Aktif',
            'inactive' => 'Tidak Aktif',
        ];

        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'email'        => $this->email,
            'role'         => $this->role,
            'role_label'   => $roleLabels[$this->role] ?? $this->role,
            'shift'        => $this->shift,
            'shift_label'  => $shiftLabels[$this->shift] ?? '-',
            'status'       => $this->status,
            'status_label' => $statusLabels[$this->status] ?? $this->status,
            'created_at'   => $this->created_at?->format('d/m/Y'),
        ];
    }
}
