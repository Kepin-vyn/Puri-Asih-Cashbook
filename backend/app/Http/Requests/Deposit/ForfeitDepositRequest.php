<?php

namespace App\Http\Requests\Deposit;

use Illuminate\Foundation\Http\FormRequest;

class ForfeitDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'note.required' => 'Alasan deposit hangus wajib diisi.',
            'note.min'      => 'Alasan harus minimal 10 karakter (contoh: kerusakan fasilitas kamar).',
            'note.max'      => 'Alasan maksimal 500 karakter.',
        ];
    }
}
