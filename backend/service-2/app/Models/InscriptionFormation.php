<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InscriptionFormation extends Model
{
    use HasFactory;
    protected $table = 'inscriptions_formation';
    protected $fillable = ['niveau', 'rythme', 'objectif', 'disponibilite', 'groupe_estime'];
    public $timestamps = true;
}
