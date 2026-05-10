<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Deposit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'shift_id',
        'user_id',
        'guest_name',
        'room_number',
        'check_in_date',
        'check_out_date',
        'amount',
        'payment_method',
        'status',
        'refund_date',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'refund_date' => 'date',
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

    // ==========================================
    // Accessor
    // ==========================================

    /**
     * True jika deposit akan expired besok atau sudah lewat dan masih aktif
     */
    public function getIsExpiringSoonAttribute(): bool
    {
        return $this->status === 'active'
            && $this->check_out_date !== null
            && $this->check_out_date->lte(Carbon::tomorrow());
    }
}
