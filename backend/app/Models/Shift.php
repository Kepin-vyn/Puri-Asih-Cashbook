<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'started_at',
        'ended_at',
        'handover_to',
        'handover_note',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    // ==========================================
    // Relasi
    // ==========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function handoverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handover_to');
    }

    public function kasTransactions(): HasMany
    {
        return $this->hasMany(KasTransaction::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }
}
