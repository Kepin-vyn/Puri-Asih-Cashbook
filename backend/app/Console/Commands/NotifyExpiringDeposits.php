<?php

namespace App\Console\Commands;

use App\Models\Deposit;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class NotifyExpiringDeposits extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'deposits:notify-expiring';

    /**
     * The console command description.
     */
    protected $description = 'Kirim notifikasi ke FO untuk deposit yang akan jatuh tempo besok (H-1 checkout).';

    public function handle(): int
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        // Cari semua deposit aktif yang check_out_date-nya adalah besok
        $expiringDeposits = Deposit::with('user')
            ->where('status', 'active')
            ->whereDate('check_out_date', $tomorrow)
            ->get();

        if ($expiringDeposits->isEmpty()) {
            $this->info('Tidak ada deposit yang akan jatuh tempo besok.');
            return self::SUCCESS;
        }

        // Ambil semua akun FO yang aktif
        $foUsers = User::where('role', 'fo')
                       ->where('status', 'active')
                       ->get();

        if ($foUsers->isEmpty()) {
            $this->warn('Tidak ada staff FO aktif yang dapat menerima notifikasi.');
            return self::SUCCESS;
        }

        $notificationsSent = 0;

        foreach ($expiringDeposits as $deposit) {
            $amountFormatted = 'Rp ' . number_format($deposit->amount, 0, ',', '.');

            foreach ($foUsers as $fo) {
                // Cek apakah notifikasi untuk deposit ini sudah dikirim hari ini
                $alreadySent = Notification::where('user_id', $fo->id)
                    ->where('type', 'deposit_expiring')
                    ->whereDate('created_at', Carbon::today())
                    ->where('data->deposit_id', $deposit->id)
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                Notification::create([
                    'user_id' => $fo->id,
                    'type'    => 'deposit_expiring',
                    'title'   => 'Pengingat: Deposit Tamu Mendekati Jatuh Tempo',
                    'message' => "Deposit tamu {$deposit->guest_name} kamar {$deposit->room_number} "
                               . "sebesar {$amountFormatted} akan jatuh tempo besok "
                               . "({$deposit->check_out_date}). Harap segera diproses.",
                    'data'    => [
                        'deposit_id'     => $deposit->id,
                        'guest_name'     => $deposit->guest_name,
                        'room_number'    => $deposit->room_number,
                        'check_out_date' => $deposit->check_out_date,
                        'amount'         => $deposit->amount,
                    ],
                ]);

                $notificationsSent++;
            }
        }

        $this->info("Selesai! {$expiringDeposits->count()} deposit akan jatuh tempo besok.");
        $this->info("{$notificationsSent} notifikasi berhasil dikirim ke staff FO.");

        return self::SUCCESS;
    }
}
