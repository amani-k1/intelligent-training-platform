<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use App\Models\Financier_Formateur;
use App\Models\Financier_Candidat;

class FormationRealise extends Model
{
    //
    use SoftDeletes;
    protected $fillable = [
        'formateur',
        'formation',
        'date_realisation',
        'nbr_participants',
    ];

    public function financierFormateur()
    {
        return $this->hasMany(Financier_Formateur::class);
    }

    public function financierCandidat()
    {
        return $this->hasMany(Financier_Candidat::class);
    }
}
