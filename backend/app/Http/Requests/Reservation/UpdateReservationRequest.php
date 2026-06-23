<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name'       => ['sometimes', 'string', 'max:255'],
            'room_number'      => ['sometimes', 'string', 'max:10'],
            'reservation_date' => ['sometimes', 'date'],
            'check_in_date'    => ['sometimes', 'date'],
            'check_out_date'   => ['sometimes', 'date', 'after:check_in_date'],
            'room_price'       => ['sometimes', 'numeric', 'min:1'],
            'down_payment'     => ['sometimes', 'numeric', 'min:0'],
            'payment_method'   => ['sometimes', 'in:tunai,transfer,qris,kartu_kredit'],
            'payment_status'   => ['sometimes', 'in:dp,lunas'],
            'source'           => ['sometimes', 'in:walk_in,tiket,booking'],
            'remarks'          => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * After standard validation: ensure down_payment never exceeds room_price.
     * We merge the incoming value with the existing reservation data so the
     * cross-field check works even when only one of the two fields is sent.
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($validator) {
            $reservation = $this->route('reservation')
                ? \App\Models\Reservation::find($this->route('reservation'))
                : null;

            if (!$reservation) {
                return;
            }

            $roomPrice   = $this->input('room_price', $reservation->room_price);
            $downPayment = $this->input('down_payment', $reservation->down_payment);

            if ($downPayment > $roomPrice) {
                $validator->errors()->add('down_payment', 'Down payment tidak boleh melebihi harga kamar.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'guest_name.max'               => 'Nama tamu maksimal 255 karakter.',
            'room_number.max'              => 'Nomor kamar maksimal 10 karakter.',
            'reservation_date.date'        => 'Format tanggal reservasi tidak valid.',
            'check_in_date.date'           => 'Format tanggal check-in tidak valid.',
            'check_out_date.date'          => 'Format tanggal check-out tidak valid.',
            'check_out_date.after'         => 'Tanggal check-out harus setelah tanggal check-in.',
            'room_price.numeric'           => 'Harga kamar harus berupa angka.',
            'room_price.min'               => 'Harga kamar minimal Rp 1.',
            'down_payment.numeric'         => 'Down payment harus berupa angka.',
            'down_payment.min'             => 'Down payment tidak boleh negatif.',
            'payment_method.in'            => 'Metode pembayaran tidak valid.',
            'payment_status.in'            => 'Status pembayaran tidak valid.',
            'source.in'                    => 'Sumber reservasi tidak valid.',
            'remarks.max'                  => 'Keterangan maksimal 500 karakter.',
        ];
    }
}
