<?php

namespace App\Services;

use App\Models\Shift;
use App\Models\KasTransaction;
use App\Models\Expense;
use App\Models\Reservation;
use App\Models\Deposit;
use Illuminate\Support\Facades\DB;

class ShiftService
{
    /**
     * Ambil shift aktif milik user tertentu
     */
    public function getActiveShift(int $userId): ?Shift
    {
        return Shift::where('user_id', $userId)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Hitung ringkasan keuangan dari shift tertentu
     */
    public function getShiftSummary(int $shiftId): array
    {
        // KAS Transactions
        $kas = KasTransaction::where('shift_id', $shiftId)
            ->select(
                DB::raw('COALESCE(SUM(amount), 0) as total_kas'),
                DB::raw('COUNT(*) as kas_count')
            )
            ->first();

        // Expenses (hanya yang approved / auto_approved)
        $expenses = Expense::where('shift_id', $shiftId)
            ->whereIn('status', ['auto_approved', 'approved'])
            ->select(
                DB::raw('COALESCE(SUM(total_price), 0) as total_expenses'),
                DB::raw('COUNT(*) as expense_count')
            )
            ->first();

        // Reservasi
        $reservations = Reservation::where('shift_id', $shiftId)
            ->select(
                DB::raw('COALESCE(SUM(room_price), 0) as total_reservasi'),
                DB::raw('COUNT(*) as reservation_count')
            )
            ->first();

        // Deposit masuk (status: active)
        $depositMasuk = Deposit::where('shift_id', $shiftId)
            ->where('status', 'active')
            ->select(
                DB::raw('COALESCE(SUM(amount), 0) as total_deposit_masuk'),
                DB::raw('COUNT(*) as deposit_masuk_count')
            )
            ->first();

        // Deposit keluar / refunded
        $depositKeluar = Deposit::where('shift_id', $shiftId)
            ->where('status', 'refunded')
            ->select(
                DB::raw('COALESCE(SUM(amount), 0) as total_deposit_keluar'),
                DB::raw('COUNT(*) as deposit_keluar_count')
            )
            ->first();

        $totalKas       = (float) $kas->total_kas;
        $totalExpenses  = (float) $expenses->total_expenses;
        $totalReservasi = (float) $reservations->total_reservasi;
        $totalDepositMasuk  = (float) $depositMasuk->total_deposit_masuk;
        $totalDepositKeluar = (float) $depositKeluar->total_deposit_keluar;

        $totalPemasukan   = $totalKas + $totalReservasi;
        $totalPengeluaran = $totalExpenses;
        $saldoAkhir       = $totalPemasukan - $totalPengeluaran;

        return [
            'kas' => [
                'total'  => (int) $totalKas,
                'count'  => (int) $kas->kas_count,
                'total_formatted' => 'Rp ' . number_format($totalKas, 0, ',', '.'),
            ],
            'expenses' => [
                'total'  => (int) $totalExpenses,
                'count'  => (int) $expenses->expense_count,
                'total_formatted' => 'Rp ' . number_format($totalExpenses, 0, ',', '.'),
            ],
            'reservations' => [
                'total'  => (int) $totalReservasi,
                'count'  => (int) $reservations->reservation_count,
                'total_formatted' => 'Rp ' . number_format($totalReservasi, 0, ',', '.'),
            ],
            'deposits' => [
                'masuk' => [
                    'total'  => (int) $totalDepositMasuk,
                    'count'  => (int) $depositMasuk->deposit_masuk_count,
                    'total_formatted' => 'Rp ' . number_format($totalDepositMasuk, 0, ',', '.'),
                ],
                'keluar' => [
                    'total'  => (int) $totalDepositKeluar,
                    'count'  => (int) $depositKeluar->deposit_keluar_count,
                    'total_formatted' => 'Rp ' . number_format($totalDepositKeluar, 0, ',', '.'),
                ],
            ],
            'total_pemasukan'  => (int) $totalPemasukan,
            'total_pemasukan_formatted'  => 'Rp ' . number_format($totalPemasukan, 0, ',', '.'),
            'total_pengeluaran' => (int) $totalPengeluaran,
            'total_pengeluaran_formatted' => 'Rp ' . number_format($totalPengeluaran, 0, ',', '.'),
            'saldo_akhir'      => (int) $saldoAkhir,
            'saldo_akhir_formatted' => 'Rp ' . number_format($saldoAkhir, 0, ',', '.'),
        ];
    }

    /**
     * Cek apakah shift bisa di-handover
     * Tidak boleh ada pengeluaran berstatus 'pending'
     */
    public function canHandover(int $shiftId): array
    {
        $pendingCount = Expense::where('shift_id', $shiftId)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount > 0) {
            return [
                'can_handover' => false,
                'message'      => "Masih ada {$pendingCount} pengeluaran menunggu persetujuan.",
                'pending_count' => $pendingCount,
            ];
        }

        return [
            'can_handover'  => true,
            'message'       => 'Shift siap untuk diserahterimakan.',
            'pending_count' => 0,
        ];
    }

    /**
     * Generate data lengkap untuk Shift Report
     */
    public function generateShiftReport(Shift $shift): array
    {
        $summary = $this->getShiftSummary($shift->id);

        // Detail KAS Transactions
        $kasTransactions = KasTransaction::where('shift_id', $shift->id)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        // Detail Expenses
        $expenses = Expense::where('shift_id', $shift->id)
            ->with(['user', 'approvedBy'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Detail Reservations
        $reservations = Reservation::where('shift_id', $shift->id)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        // Detail Deposits
        $deposits = Deposit::where('shift_id', $shift->id)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        // Info Shift
        $shift->load(['user', 'handoverUser']);

        $typeLabels = [
            'pagi'   => 'Pagi',
            'siang'  => 'Siang',
            'malam'  => 'Malam',
        ];

        return [
            'shift' => [
                'id'         => $shift->id,
                'staff_name' => $shift->user->name ?? '-',
                'type'       => $shift->type,
                'type_label' => $typeLabels[$shift->type] ?? $shift->type,
                'started_at' => $shift->started_at?->format('d/m/Y H:i'),
                'ended_at'   => $shift->ended_at?->format('d/m/Y H:i'),
                'tanggal'    => $shift->started_at?->format('d/m/Y'),
                'status'     => $shift->status,
                'handover_to_name' => $shift->handoverUser->name ?? null,
                'handover_note'    => $shift->handover_note,
            ],
            'summary'      => $summary,
            'kas'          => $kasTransactions,
            'expenses'     => $expenses,
            'reservations' => $reservations,
            'deposits'     => $deposits,
        ];
    }
}
