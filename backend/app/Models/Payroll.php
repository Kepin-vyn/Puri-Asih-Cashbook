<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    protected $fillable = [
        'user_id',
        'month',
        'year',
        'total_present',
        'total_leave',
        'total_absent',
        'daily_rate',
        'total_salary',
    ];

    protected function casts(): array
    {
        return [
            'daily_rate' => 'decimal:2',
            'total_salary' => 'decimal:2',
        ];
    }

    // ==========================================
    // Relasi
    // ==========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
