<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollSetting extends Model
{
    protected $fillable = [
        'daily_rate',
        'effective_date',
        'set_by',
    ];

    protected function casts(): array
    {
        return [
            'daily_rate' => 'decimal:2',
            'effective_date' => 'date',
        ];
    }

    // ==========================================
    // Relasi
    // ==========================================

    public function setter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }
}
