<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscription_Formateur extends Model
{
    //
    protected $table = 'inscription__formateurs';
    
    protected $fillable = [
        'user_id',
        'nom',
        'prenom',
        'email',
        'adresse',
        'état_civil',
        'telephone',
        'cv',
        'cycle_choisisé',
        'formation_préferée',
        'tarif',
        'nbjour_travail',
        'diplome',
        'statut',
        'formation_id'
    ];
}
