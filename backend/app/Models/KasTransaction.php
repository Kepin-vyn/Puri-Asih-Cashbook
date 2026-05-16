<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class KasTransaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'shift_id',
        'user_id',
        'guest_name',
        'room_number',
        'transaction_type',
        'payment_method',
        'amount',
        'note',
        'receipt_photo',
        'auto_generated',
        'source_reference',
    ];

    protected function casts(): array
    {
        return [
            'amount'         => 'decimal:2',
            'auto_generated' => 'boolean',
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
