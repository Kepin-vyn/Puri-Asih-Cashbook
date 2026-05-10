<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'shift_id',
        'user_id',
        'description',
        'price_per_item',
        'quantity',
        'total_price',
        'payment_method',
        'receipt_photo',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'price_per_item' => 'decimal:2',
            'total_price' => 'decimal:2',
            'approved_at' => 'datetime',
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

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
