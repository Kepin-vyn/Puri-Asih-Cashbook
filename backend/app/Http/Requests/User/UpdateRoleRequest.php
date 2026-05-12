<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => ['required', 'in:fo,manager'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.required' => 'Role wajib dipilih.',
            'role.in'       => 'Role harus fo atau manager.',
        ];
    }
}
