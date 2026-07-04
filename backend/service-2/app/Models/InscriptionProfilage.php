<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InscriptionProfilage extends Model
{
    use HasFactory;

    protected $table = 'inscription_profilages';

    // Seulement les 4 champs IA + le résultat groupe_estime
    protected $fillable = [
        'inscription_candidat_id',
        'niveau',
        'rythme',
        'objectif',
        'disponibilite_hebdo',
        'groupe_estime',
    ];

    public function inscriptionCandidat()
    {
        return $this->belongsTo(Inscription_Candidat::class, 'inscription_candidat_id');
    }
}
