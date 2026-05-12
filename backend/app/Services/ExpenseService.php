<?php

namespace App\Services;

use App\Helpers\NotificationHelper;
use App\Models\Expense;

class ExpenseService
{
    /**
     * Menghitung total harga pengeluaran
     */
    public function calculateTotal(float $pricePerItem, int $quantity): float
    {
        return $pricePerItem * $quantity;
    }

    /**
     * Menentukan status pengeluaran berdasarkan total harga
     */
    public function determineStatus(float $totalPrice): string
    {
        if ($totalPrice <= 500000) {
            return 'auto_approved';
        }

        return 'pending';
    }

    /**
     * Mengirim notifikasi ke semua Manager jika ada pengeluaran pending
     */
    public function sendPendingNotification(Expense $expense): void
    {
        $totalFormatted = number_format($expense->total_price, 0, ',', '.');
        $foName = $expense->user->name ?? 'Staff';

        NotificationHelper::sendToManagers(
            'expense_pending',
            'Pengeluaran Membutuhkan Persetujuan',
            "{$foName} mengajukan pengeluaran {$expense->description} sebesar Rp{$totalFormatted}",
            [
                'expense_id'  => $expense->id,
                'total_price' => $expense->total_price,
            ]
        );
    }
}
