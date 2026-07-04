<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InscriptionProfilage;

class InscriptionProfilageController extends Controller
{
    public function index()
    {
        return response()->json(InscriptionProfilage::with('inscriptionCandidat')->get());
    }

    public function show($id)
    {
        $profilage = InscriptionProfilage::with('inscriptionCandidat')->find($id);
        if (!$profilage) {
            return response()->json(['message' => 'Profilage introuvable'], 404);
        }
        return response()->json($profilage);
    }

    public function store(Request $request)
    {
        $profilage = InscriptionProfilage::updateOrCreate(
            ['inscription_candidat_id' => $request->inscription_candidat_id],
            $request->only(['niveau', 'rythme', 'objectif', 'disponibilite_hebdo', 'groupe_estime'])
        );
        return response()->json($profilage, 201);
    }
}
