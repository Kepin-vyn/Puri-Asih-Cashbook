<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Notification;
use App\Models\User;

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
        $managers = User::where('role', 'manager')->get();
        $totalFormatted = number_format($expense->total_price, 0, ',', '.');
        $foName = $expense->user->name ?? 'Staff';

        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type'    => 'expense_pending',
                'title'   => 'Pengeluaran Membutuhkan Persetujuan',
                'message' => "{$foName} mengajukan pengeluaran {$expense->description} sebesar Rp{$totalFormatted}",
                'data'    => [
                    'expense_id' => $expense->id,
                    'total_price' => $expense->total_price
                ],
            ]);
        }
    }
}
