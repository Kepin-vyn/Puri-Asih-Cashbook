<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description'    => ['required', 'string', 'max:255'],
            'price_per_item' => ['required', 'numeric', 'min:1'],
            'quantity'       => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'in:tunai,transfer,qris,kartu_kredit'],
        ];
    }

    public function messages(): array
    {
        return [
            'description.required'    => 'Deskripsi pengeluaran wajib diisi.',
            'description.max'         => 'Deskripsi maksimal 255 karakter.',
            'price_per_item.required' => 'Harga per item wajib diisi.',
            'price_per_item.numeric'  => 'Harga per item harus berupa angka.',
            'price_per_item.min'      => 'Harga per item minimal Rp 1.',
            'quantity.required'       => 'Jumlah item wajib diisi.',
            'quantity.integer'        => 'Jumlah item harus berupa angka bulat.',
            'quantity.min'            => 'Jumlah item minimal 1.',
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'payment_method.in'       => 'Metode pembayaran tidak valid. Pilih: tunai, transfer, qris, atau kartu_kredit.',
        ];
    }
}
