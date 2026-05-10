<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'shift_id',
        'user_id',
        'guest_name',
        'room_number',
        'reservation_date',
        'check_in_date',
        'check_out_date',
        'room_price',
        'down_payment',
        'remaining_balance',
        'payment_method',
        'payment_status',
        'source',
        'status',
        'invoice_number',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'room_price' => 'decimal:2',
            'down_payment' => 'decimal:2',
            'remaining_balance' => 'decimal:2',
            'reservation_date' => 'date',
            'check_in_date' => 'date',
            'check_out_date' => 'date',
        ];
    }

    // ==========================================
    // Relasi
    // ==========================================

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
