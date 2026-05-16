<?php

namespace App\Http\Requests\ShiftSchedule;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        $dayRules = [];
        foreach ($days as $day) {
            $dayRules[$day] = ['required', 'in:pagi,siang,malam,off'];
        }

        return array_merge([
            'user_id'         => ['required', 'exists:users,id'],
            'week_start_date' => ['required', 'date', function ($attribute, $value, $fail) {
                if (Carbon::parse($value)->dayOfWeek !== Carbon::MONDAY) {
                    $fail('Tanggal awal minggu harus hari Senin.');
                }
            }],
        ], $dayRules);
    }

    public function messages(): array
    {
        return [
            'user_id.required'         => 'Staff FO wajib dipilih.',
            'user_id.exists'           => 'Staff FO tidak ditemukan.',
            'week_start_date.required' => 'Tanggal awal minggu wajib diisi.',
            'week_start_date.date'     => 'Format tanggal tidak valid.',
            'monday.required'          => 'Jadwal Senin wajib diisi.',
            'monday.in'                => 'Jadwal Senin tidak valid.',
            'tuesday.required'         => 'Jadwal Selasa wajib diisi.',
            'tuesday.in'               => 'Jadwal Selasa tidak valid.',
            'wednesday.required'       => 'Jadwal Rabu wajib diisi.',
            'wednesday.in'             => 'Jadwal Rabu tidak valid.',
            'thursday.required'        => 'Jadwal Kamis wajib diisi.',
            'thursday.in'              => 'Jadwal Kamis tidak valid.',
            'friday.required'          => 'Jadwal Jumat wajib diisi.',
            'friday.in'                => 'Jadwal Jumat tidak valid.',
            'saturday.required'        => 'Jadwal Sabtu wajib diisi.',
            'saturday.in'              => 'Jadwal Sabtu tidak valid.',
            'sunday.required'          => 'Jadwal Minggu wajib diisi.',
            'sunday.in'                => 'Jadwal Minggu tidak valid.',
        ];
    }
}
