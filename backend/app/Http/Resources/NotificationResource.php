<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Set locale Indonesia untuk diffForHumans
        Carbon::setLocale('id');

        return [
            'id'         => $this->id,
            'type'       => $this->type,
            'title'      => $this->title,
            'message'    => $this->message,
            'data'       => $this->data,
            'is_read'    => $this->read_at !== null,
            'read_at'    => $this->read_at?->format('d/m/Y H:i'),
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
            'time_ago'   => $this->created_at
                ? Carbon::parse($this->created_at)->diffForHumans()
                : null,
        ];
    }
}
