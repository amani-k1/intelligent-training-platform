<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Financier_Candidat extends Model
{
    //
    protected$fillable = [
        'user_id',
        'nom',
        'prenom',
        'etat_payment',
        'mode_payment',
        'montant',
        'avance',
        'rest_a_payer',
        'FormationRealise_id'
    ];
    public function formationRealise()
    {
        return $this->belongsTo(FormationRealise::class);
    }

}
