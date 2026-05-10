<?php

namespace App\Http\Requests\Kas;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name'       => ['sometimes', 'string', 'max:255'],
            'room_number'      => ['sometimes', 'nullable', 'string', 'max:10'],
            'transaction_type' => ['sometimes', 'in:reservasi,checkin,pelunasan'],
            'payment_method'   => ['sometimes', 'in:tunai,transfer,qris,kartu_kredit'],
            'amount'           => ['sometimes', 'numeric', 'min:1'],
            'note'             => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'guest_name.max'            => 'Nama tamu maksimal 255 karakter.',
            'room_number.max'           => 'Nomor kamar maksimal 10 karakter.',
            'transaction_type.in'       => 'Jenis transaksi tidak valid. Pilih: reservasi, checkin, atau pelunasan.',
            'payment_method.in'         => 'Metode pembayaran tidak valid. Pilih: tunai, transfer, qris, atau kartu_kredit.',
            'amount.numeric'            => 'Jumlah nominal harus berupa angka.',
            'amount.min'                => 'Jumlah nominal minimal Rp 1.',
            'note.max'                  => 'Catatan maksimal 500 karakter.',
        ];
    }
}
