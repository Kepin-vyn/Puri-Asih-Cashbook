<?php

namespace App\Http\Requests\Attendance;

use App\Models\Attendance;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:hadir,libur,sakit,izin,alpha'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status absensi wajib dipilih.',
            'status.in'       => 'Status tidak valid. Pilih: hadir, libur, sakit, izin, atau alpha.',
        ];
    }

    /**
     * Validasi tambahan setelah rules dasar lolos.
     * Jika status = 'libur', cek total libur bulan ini tidak melebihi 6x.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->status !== 'libur') {
                return;
            }

            // Ambil attendance yang sedang diupdate
            $attendance = Attendance::find($this->route('id'));
            if (! $attendance) {
                return;
            }

            // Hitung total libur bulan ini untuk user ini (exclude record ini sendiri)
            $month = $attendance->attendance_date
                ? $attendance->attendance_date->month
                : now()->month;
            $year  = $attendance->attendance_date
                ? $attendance->attendance_date->year
                : now()->year;

            $totalLibur = Attendance::where('user_id', $attendance->user_id)
                ->where('id', '!=', $attendance->id)
                ->where('status', 'libur')
                ->whereMonth('attendance_date', $month)
                ->whereYear('attendance_date', $year)
                ->count();

            if ($totalLibur >= 6) {
                $validator->errors()->add(
                    'status',
                    'Jatah libur bulan ini sudah mencapai batas maksimal (6 hari).'
                );
            }
        });
    }
}
