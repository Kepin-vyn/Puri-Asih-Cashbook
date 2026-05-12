<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class CheckinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shift_type'        => ['required', 'in:pagi,siang,malam'],
            'digital_signature' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'shift_type.required'        => 'Jenis shift wajib dipilih.',
            'shift_type.in'              => 'Jenis shift tidak valid. Pilih: pagi, siang, atau malam.',
            'digital_signature.required' => 'Tanda tangan digital wajib diisi.',
            'digital_signature.string'   => 'Tanda tangan digital harus berupa string.',
        ];
    }
}
