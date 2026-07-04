<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Alerte; // si vous avez créé le modèle Alerte

class RechercheController extends Controller
{
    public function search(Request $request)
    {
        $recherche = $request->input('recherche');

        // Appel au service d'embedding (port 5002)
        try {
            $response = Http::post('http://service-4-embedding:5002/detect', [
                'requete' => $recherche
            ]);
        } catch (\Exception) {
            return response()->json(['error' => 'Service de détection indisponible'], 500);
        }

        $data = $response->json();

        // Si la formation n'existe pas, on enregistre une alerte
        if (!$data['existe']) {
            Alerte::create([
                'recherche'          => $data['requete'],
                'formation_proche'   => $data['formation_proche'],
                'similarite'         => $data['similarite'],
                'formations_proches' => $data['formations_proches'] ?? [],
            ]);
        }

        return response()->json($data);
    }
}
