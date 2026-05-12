<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shift' => ['required', 'in:pagi,siang,malam'],
        ];
    }

    public function messages(): array
    {
        return [
            'shift.required' => 'Shift wajib dipilih.',
            'shift.in'       => 'Shift harus pagi, siang, atau malam.',
        ];
    }
}
