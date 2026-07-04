<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'xp',
        'condition',
        'color'
    ];

    // Relation avec les assignations
    public function assignments()
    {
        return $this->hasMany(BadgeAssignment::class);
    }

    // Pour le comptage automatique
    protected $appends = ['assigned_count'];

    public function getAssignedCountAttribute()
    {
        return $this->assignments()->count();
    }
}