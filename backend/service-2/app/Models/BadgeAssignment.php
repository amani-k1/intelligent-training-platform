<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BadgeAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'badge_id',
        'user_id',
        'user_name',
        'user_role',
        'note',
        'assigned_at'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    /**
     * Relation avec le badge
     */
    public function badge()
    {
        return $this->belongsTo(Badge::class);
    }
}