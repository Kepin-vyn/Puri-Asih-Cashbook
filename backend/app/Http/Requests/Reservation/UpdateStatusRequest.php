<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:checkin,checkout,cancel,noshow'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status reservasi wajib diisi.',
            'status.in'       => 'Status tidak valid. Pilih: checkin, checkout, cancel, atau noshow.',
        ];
    }
}
