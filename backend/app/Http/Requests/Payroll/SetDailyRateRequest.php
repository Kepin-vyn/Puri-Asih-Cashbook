<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class SetDailyRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'daily_rate' => ['required', 'numeric', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'daily_rate.required' => 'Tarif harian wajib diisi.',
            'daily_rate.numeric'  => 'Tarif harian harus berupa angka.',
            'daily_rate.min'      => 'Tarif harian minimal Rp 1.',
        ];
    }
}
