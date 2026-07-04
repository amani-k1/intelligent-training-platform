<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    use HasFactory;

    protected $fillable = [
        'recherche',
        'formation_proche',
        'similarite',
        'formations_proches',
        'archived',
    ];

    protected $casts = [
        'formations_proches' => 'array',
        'archived'           => 'boolean',
    ];
}
