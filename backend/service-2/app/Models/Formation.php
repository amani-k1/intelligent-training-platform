<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Formation extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'nom_formateur',
        'id_formateur',
        'duree',
        'domaine',
        'niveau',
        'prix',
        'places_totales',
        'statut',
        'date_debut',
        'date_fin',
        'programme',
    ];

    protected $casts = [
        'programme' => 'array',
    ];

    public function inscriptionCandidats()
    {
        return $this->hasMany(Inscription_Candidat::class, 'formation_id');
    }

    public function resources()
    {
        return $this->hasMany(Resource::class, 'formation_id');
    }
}
