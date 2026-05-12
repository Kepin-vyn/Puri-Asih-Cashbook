<?php

namespace App\Helpers;

use Carbon\Carbon;

class FormatHelper
{
    /**
     * Format angka ke format Rupiah lengkap.
     * Contoh: rupiah(150000) → "Rp 150.000"
     *
     * @param  int|float|null $amount
     * @return string
     */
    public static function rupiah(int|float|null $amount): string
    {
        return 'Rp ' . number_format((float) ($amount ?? 0), 0, ',', '.');
    }

    /**
     * Format angka ke format Rupiah singkat (untuk dashboard).
     * >= 1.000.000 → "Rp 1,5 Jt"
     * >= 1.000     → "Rp 150 Rb"
     * Lainnya      → "Rp 150"
     *
     * @param  int|float|null $amount
     * @return string
     */
    public static function rupiahShort(int|float|null $amount): string
    {
        $value = (float) ($amount ?? 0);

        if ($value >= 1_000_000) {
            $juta = $value / 1_000_000;
            // Tampilkan 1 desimal jika tidak bulat, misal 1.5 Jt
            $formatted = ($juta == floor($juta))
                ? number_format($juta, 0, ',', '.')
                : number_format($juta, 1, ',', '.');
            return 'Rp ' . $formatted . ' Jt';
        }

        if ($value >= 1_000) {
            $ribu = $value / 1_000;
            $formatted = ($ribu == floor($ribu))
                ? number_format($ribu, 0, ',', '.')
                : number_format($ribu, 1, ',', '.');
            return 'Rp ' . $formatted . ' Rb';
        }

        return 'Rp ' . number_format($value, 0, ',', '.');
    }

    /**
     * Format tanggal ke format Indonesia panjang.
     * Contoh: dateId('2026-05-10') → "10 Mei 2026"
     *
     * @param  string|\Carbon\Carbon|null $date
     * @return string
     */
    public static function dateId(string|Carbon|null $date): string
    {
        if (empty($date)) return '-';

        return Carbon::parse($date)
            ->locale('id')
            ->isoFormat('D MMMM YYYY');
    }

    /**
     * Format datetime ke format Indonesia dengan jam.
     * Contoh: dateTimeId('2026-05-10 08:30:00') → "10 Mei 2026, 08:30"
     *
     * @param  string|\Carbon\Carbon|null $datetime
     * @return string
     */
    public static function dateTimeId(string|Carbon|null $datetime): string
    {
        if (empty($datetime)) return '-';

        return Carbon::parse($datetime)
            ->locale('id')
            ->isoFormat('D MMMM YYYY, HH:mm');
    }
}
