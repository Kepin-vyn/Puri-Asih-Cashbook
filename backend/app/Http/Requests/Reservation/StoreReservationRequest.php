<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name'       => ['required', 'string', 'max:255'],
            'room_number'      => ['required', 'string', 'max:10'],
            'reservation_date' => ['required', 'date'],
            'check_in_date'    => ['required', 'date', 'after_or_equal:reservation_date'],
            'check_out_date'   => ['required', 'date', 'after:check_in_date'],
            'room_price'       => ['required', 'numeric', 'min:1'],
            'down_payment'     => ['required', 'numeric', 'min:0'],
            'payment_method'   => ['required', 'in:tunai,transfer,qris,kartu_kredit'],
            'payment_status'   => ['required', 'in:dp,lunas'],
            'source'           => ['required', 'in:walk_in,tiket,booking'],
            'remarks'          => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'guest_name.required'              => 'Nama tamu wajib diisi.',
            'guest_name.max'                   => 'Nama tamu maksimal 255 karakter.',
            'room_number.required'             => 'Nomor kamar wajib diisi.',
            'room_number.max'                  => 'Nomor kamar maksimal 10 karakter.',
            'reservation_date.required'        => 'Tanggal reservasi wajib diisi.',
            'reservation_date.date'            => 'Format tanggal reservasi tidak valid.',
            'check_in_date.required'           => 'Tanggal check-in wajib diisi.',
            'check_in_date.date'               => 'Format tanggal check-in tidak valid.',
            'check_in_date.after_or_equal'     => 'Tanggal check-in harus sama dengan atau setelah tanggal reservasi.',
            'check_out_date.required'          => 'Tanggal check-out wajib diisi.',
            'check_out_date.date'              => 'Format tanggal check-out tidak valid.',
            'check_out_date.after'             => 'Tanggal check-out harus setelah tanggal check-in.',
            'room_price.required'              => 'Harga kamar wajib diisi.',
            'room_price.numeric'               => 'Harga kamar harus berupa angka.',
            'room_price.min'                   => 'Harga kamar minimal Rp 1.',
            'down_payment.required'            => 'Down payment wajib diisi.',
            'down_payment.numeric'             => 'Down payment harus berupa angka.',
            'down_payment.min'                 => 'Down payment tidak boleh negatif.',
            'payment_method.required'          => 'Metode pembayaran wajib dipilih.',
            'payment_method.in'                => 'Metode pembayaran tidak valid. Pilih: tunai, transfer, qris, atau kartu_kredit.',
            'payment_status.required'          => 'Status pembayaran wajib dipilih.',
            'payment_status.in'                => 'Status pembayaran tidak valid. Pilih: dp atau lunas.',
            'source.required'                  => 'Sumber reservasi wajib dipilih.',
            'source.in'                        => 'Sumber reservasi tidak valid. Pilih: walk_in, tiket, atau booking.',
            'remarks.max'                      => 'Keterangan maksimal 500 karakter.',
        ];
    }
}
