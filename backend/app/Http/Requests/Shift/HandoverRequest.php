<?php

namespace App\Http\Requests\Shift;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use App\Models\User;

class HandoverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'handover_to'   => ['required', 'integer', 'exists:users,id'],
            'handover_note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'handover_to.required' => 'Penerima shift wajib diisi.',
            'handover_to.integer'  => 'ID penerima shift harus berupa angka.',
            'handover_to.exists'   => 'Penerima shift tidak ditemukan dalam sistem.',
            'handover_note.string' => 'Catatan serah terima harus berupa teks.',
            'handover_note.max'    => 'Catatan serah terima maksimal 500 karakter.',
        ];
    }

    /**
     * Validasi tambahan: pastikan penerima shift memiliki role 'fo'
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('handover_to')) {
                    return;
                }

                $user = User::find($this->handover_to);

                if ($user && $user->role !== 'fo') {
                    $validator->errors()->add(
                        'handover_to',
                        'Penerima shift harus memiliki role Front Office (FO).'
                    );
                }
            },
        ];
    }
}
