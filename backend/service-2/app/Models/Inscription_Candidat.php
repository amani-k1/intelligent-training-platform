<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inscription_Candidat extends Model
{
    use HasFactory;

    protected $table = 'inscription__candidats';

    protected $fillable = [
        'formation_id',
        'nom',
        'prenom',
        'email',
        'adresse',
        'état_civil',
        'telephone',
        'cv',
        'situation',
        'format',
        'statut',
        'vue_formateur',
        // Champs profil complet (déplacés depuis inscription_profilages)
        'niveau',
        'rythme',
        'objectif',
        'disponibilite_hebdo',
        'score_technique',
        'score_soft_skills',
        'nb_formations_anterieures',
        'experience',
        'preference_format',
        'preference_horaire',
        'categorie_client',
    ];

    // Relation avec la formation
    public function formation()
    {
        return $this->belongsTo(Formation::class);
    }

    // Relation avec le profilage
    public function profilage()
    {
        return $this->hasOne(InscriptionProfilage::class, 'inscription_candidat_id');
    }
}