<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'shift_id',
        'shift_type',
        'actual_start',
        'actual_end',
        'status',
        'is_late',
        'digital_signature',
        'attendance_date',
    ];

    protected function casts(): array
    {
        return [
            'actual_start' => 'datetime',
            'actual_end' => 'datetime',
            'is_late' => 'boolean',
            'attendance_date' => 'date',
        ];
    }

    // ==========================================
    // Relasi
    // ==========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
