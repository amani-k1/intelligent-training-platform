<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\InscriptionFormation;
use Illuminate\Support\Facades\Http;
class InscriptionFormationController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validation des données
        $validated = $request->validate([
            'niveau' => 'required|string',
            'rythme' => 'required|string',
            'objectif' => 'required|string',
            'disponibilite' => 'required|string',
        ]);

        // 2. Appel au service IA (service-3-ia) pour obtenir le groupe estimé
        $response = Http::post('http://127.0.0.1:5001/predict', [
            'niveau' => $request->niveau,
            'rythme' => $request->rythme,
            'objectif' => $request->objectif,
            'disponibilite' => $request->disponibilite,
        ]);

        if ($response->successful()) {
            $prediction = $response->json();
            $validated['groupe_estime'] = $prediction['groupe'];
        } else {
            // Gestion d'erreur : valeur par défaut ou log
            $validated['groupe_estime'] = 'non_determine';
        }

        // 3. Création de l'inscription en base de données
        $inscription = InscriptionFormation::create($validated);

        // 4. Réponse JSON
        return response()->json([
            'message' => 'Inscription formation réussie',
            'inscription' => $inscription,
            'prediction' => $prediction ?? null,
        ], 201);
    }
}
