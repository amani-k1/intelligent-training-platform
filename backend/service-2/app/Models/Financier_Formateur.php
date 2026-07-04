<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\FormationRealise;

class Financier_Formateur extends Model
{
    //
    protected $fillable = [
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
