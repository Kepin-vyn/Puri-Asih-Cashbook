<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftSchedule extends Model
{
    protected $fillable = [
        'user_id',
        'week_start_date',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
        'created_by',
    ];

    protected $casts = [
        'week_start_date' => 'date',
    ];

    // ── Relasi ────────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Accessor ──────────────────────────────────────────────────────────────

    /**
     * Ambil shift hari ini berdasarkan nama hari (lowercase English).
     * Return: 'pagi' | 'siang' | 'malam' | 'off'
     */
    public function getTodayShiftAttribute(): string
    {
        $dayName = strtolower(Carbon::now()->englishDayOfWeek); // monday, tuesday, ...
        return $this->{$dayName} ?? 'off';
    }
}
