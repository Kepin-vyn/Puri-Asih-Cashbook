<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user') ?? $this->route('id');

        return [
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', 'unique:users,email,' . $userId],
            'password' => ['sometimes', 'nullable', 'string', 'min:6', 'confirmed'],
            'shift'    => ['sometimes', 'nullable', 'in:pagi,siang,malam'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max'           => 'Nama maksimal 255 karakter.',
            'email.email'        => 'Format email tidak valid.',
            'email.unique'       => 'Email sudah terdaftar.',
            'password.min'       => 'Password minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'shift.in'           => 'Shift harus pagi, siang, atau malam.',
        ];
    }
}
