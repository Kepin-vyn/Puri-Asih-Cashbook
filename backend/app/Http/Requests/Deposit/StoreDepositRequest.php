<?php

namespace App\Http\Requests\Deposit;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name'     => ['required', 'string', 'max:255'],
            'room_number'    => ['required', 'string', 'max:10'],
            'check_in_date'  => ['required', 'date'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'amount'         => ['required', 'numeric', 'min:1'],
            'payment_method' => ['required', 'in:tunai,transfer,qris,kartu_kredit'],
            'note'           => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'guest_name.required'      => 'Nama tamu wajib diisi.',
            'guest_name.max'           => 'Nama tamu maksimal 255 karakter.',
            'room_number.required'     => 'Nomor kamar wajib diisi.',
            'room_number.max'          => 'Nomor kamar maksimal 10 karakter.',
            'check_in_date.required'   => 'Tanggal check-in wajib diisi.',
            'check_in_date.date'       => 'Format tanggal check-in tidak valid.',
            'check_out_date.required'  => 'Tanggal check-out wajib diisi.',
            'check_out_date.date'      => 'Format tanggal check-out tidak valid.',
            'check_out_date.after'     => 'Tanggal check-out harus setelah tanggal check-in.',
            'amount.required'          => 'Jumlah deposit wajib diisi.',
            'amount.numeric'           => 'Jumlah deposit harus berupa angka.',
            'amount.min'               => 'Jumlah deposit minimal Rp 1.',
            'payment_method.required'  => 'Metode pembayaran wajib dipilih.',
            'payment_method.in'        => 'Metode pembayaran tidak valid. Pilih: tunai, transfer, qris, atau kartu_kredit.',
            'note.max'                 => 'Catatan maksimal 500 karakter.',
        ];
    }
}
