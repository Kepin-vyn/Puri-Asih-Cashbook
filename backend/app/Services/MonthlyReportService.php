<?php

namespace App\Services;

use App\Models\KasTransaction;
use App\Models\Expense;
use App\Models\Reservation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MonthlyReportService
{
    /**
     * Ambil data lengkap laporan bulanan dari 3 sumber:
     * KAS, Reservasi, Pengeluaran (Deposit TIDAK termasuk)
     */
    public function getMonthlyData(int $month, int $year, array $filters = []): array
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate   = Carbon::create($year, $month, 1)->endOfMonth();

        // ========== KAS Transactions ==========
        $kasQuery = KasTransaction::with(['user', 'shift'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (!empty($filters['staff_id'])) {
            $kasQuery->where('user_id', $filters['staff_id']);
        }

        $kasTransactions = $kasQuery->orderBy('created_at', 'asc')->get();

        $kasAgg = KasTransaction::whereBetween('created_at', [$startDate, $endDate])
            ->when(!empty($filters['staff_id']), fn($q) => $q->where('user_id', $filters['staff_id']))
            ->select(
                DB::raw('COALESCE(SUM(amount), 0) as total_kas'),
                DB::raw('COUNT(*) as kas_count')
            )
            ->first();

        // ========== Reservations ==========
        $rsvQuery = Reservation::with(['user', 'shift'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (!empty($filters['staff_id'])) {
            $rsvQuery->where('user_id', $filters['staff_id']);
        }

        $reservations = $rsvQuery->orderBy('created_at', 'asc')->get();

        $rsvAgg = Reservation::whereBetween('created_at', [$startDate, $endDate])
            ->when(!empty($filters['staff_id']), fn($q) => $q->where('user_id', $filters['staff_id']))
            ->select(
                DB::raw('COALESCE(SUM(room_price), 0) as total_reservasi'),
                DB::raw('COUNT(*) as reservation_count')
            )
            ->first();

        // ========== Expenses (approved only) ==========
        $expQuery = Expense::with(['user', 'shift', 'approvedBy'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['auto_approved', 'approved']);

        if (!empty($filters['staff_id'])) {
            $expQuery->where('user_id', $filters['staff_id']);
        }

        $expenses = $expQuery->orderBy('created_at', 'asc')->get();

        $expAgg = Expense::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['auto_approved', 'approved'])
            ->when(!empty($filters['staff_id']), fn($q) => $q->where('user_id', $filters['staff_id']))
            ->select(
                DB::raw('COALESCE(SUM(total_price), 0) as total_expenses'),
                DB::raw('COUNT(*) as expense_count')
            )
            ->first();

        // ========== Hitung summary ==========
        $totalKas       = (float) $kasAgg->total_kas;
        $totalReservasi = (float) $rsvAgg->total_reservasi;
        $totalExpenses  = (float) $expAgg->total_expenses;
        $totalPemasukan = $totalKas + $totalReservasi;
        $saldoBersih    = $totalPemasukan - $totalExpenses;

        $bulanNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        return [
            'period'    => ($bulanNames[$month] ?? $month) . ' ' . $year,
            'month'     => $month,
            'year'      => $year,
            'summary'   => [
                'total_pemasukan_kas'            => (int) $totalKas,
                'total_pemasukan_kas_formatted'  => 'Rp ' . number_format($totalKas, 0, ',', '.'),
                'total_pemasukan_reservasi'           => (int) $totalReservasi,
                'total_pemasukan_reservasi_formatted' => 'Rp ' . number_format($totalReservasi, 0, ',', '.'),
                'total_pemasukan'                => (int) $totalPemasukan,
                'total_pemasukan_formatted'      => 'Rp ' . number_format($totalPemasukan, 0, ',', '.'),
                'total_pengeluaran'              => (int) $totalExpenses,
                'total_pengeluaran_formatted'    => 'Rp ' . number_format($totalExpenses, 0, ',', '.'),
                'saldo_bersih'                   => (int) $saldoBersih,
                'saldo_bersih_formatted'         => 'Rp ' . number_format($saldoBersih, 0, ',', '.'),
                'kas_count'          => (int) $kasAgg->kas_count,
                'reservasi_count'    => (int) $rsvAgg->reservation_count,
                'pengeluaran_count'  => (int) $expAgg->expense_count,
            ],
            'kas'          => $kasTransactions,
            'reservations' => $reservations,
            'expenses'     => $expenses,
        ];
    }

    /**
     * Ambil ringkasan summary bulanan saja (tanpa detail transaksi)
     */
    public function getMonthlySummary(int $month, int $year): array
    {
        $data = $this->getMonthlyData($month, $year);

        return [
            'period'  => $data['period'],
            'month'   => $data['month'],
            'year'    => $data['year'],
            ...$data['summary'],
        ];
    }

    /**
     * Drill-down detail transaksi per tanggal tertentu
     */
    public function getMonthlyDetail(int $month, int $year, string $date): array
    {
        $kas = KasTransaction::with(['user', 'shift'])
            ->whereDate('created_at', $date)
            ->orderBy('created_at', 'asc')
            ->get();

        $reservations = Reservation::with(['user', 'shift'])
            ->whereDate('created_at', $date)
            ->orderBy('created_at', 'asc')
            ->get();

        $expenses = Expense::with(['user', 'shift', 'approvedBy'])
            ->whereDate('created_at', $date)
            ->whereIn('status', ['auto_approved', 'approved'])
            ->orderBy('created_at', 'asc')
            ->get();

        $totalKas       = (float) $kas->sum('amount');
        $totalReservasi = (float) $reservations->sum('room_price');
        $totalExpenses  = (float) $expenses->sum('total_price');

        return [
            'tanggal'       => Carbon::parse($date)->format('d/m/Y'),
            'tanggal_raw'   => $date,
            'ringkasan'     => [
                'total_kas'         => (int) $totalKas,
                'total_kas_formatted' => 'Rp ' . number_format($totalKas, 0, ',', '.'),
                'total_reservasi'   => (int) $totalReservasi,
                'total_reservasi_formatted' => 'Rp ' . number_format($totalReservasi, 0, ',', '.'),
                'total_pengeluaran' => (int) $totalExpenses,
                'total_pengeluaran_formatted' => 'Rp ' . number_format($totalExpenses, 0, ',', '.'),
            ],
            'kas'          => $kas,
            'reservations' => $reservations,
            'expenses'     => $expenses,
        ];
    }
}
