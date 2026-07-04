<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Inscription_Candidat;
use App\Models\InscriptionProfilage;

class AdminProfilageController extends Controller
{
    public function index()
    {
        return response()->json(InscriptionProfilage::with('inscriptionCandidat')->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        $profilage = InscriptionProfilage::with('inscriptionCandidat')->find($id);
        if (!$profilage) {
            return response()->json(['message' => 'Profilage introuvable'], 404);
        }
        return response()->json($profilage);
    }

    /**
     * Predict and store profilage for a given inscription (admin only).
     * Priority: request body > existing profilage > derived from candidat fields > safe defaults.
     */
    public function predict(Request $request, $id)
    {
        $candidat = Inscription_Candidat::findOrFail($id);

        $niveau_raw   = $candidat->niveau;
        $rythme_raw   = $candidat->rythme;
        $objectif_raw = $candidat->objectif;
        $dispo_raw    = $candidat->disponibilite_hebdo;

        // On utilise les mappers en sécurité (ils fonctionnent pour les anciennes et nouvelles valeurs)
        $niveau_ia   = $this->mapNiveau($niveau_raw);
        $rythme_ia   = $this->mapRythme($rythme_raw);
        $objectif_ia = $this->mapObjectif($objectif_raw);
        $dispo_ia    = $this->mapDispo($dispo_raw);

        $iaPayload = [
            'niveau'        => $niveau_ia,
            'rythme'        => $rythme_ia,
            'objectif'      => $objectif_ia,
            'disponibilite' => $dispo_ia,
        ];

        Log::info('[AdminProfilage] IA payload', $iaPayload);

        // Sauvegarder en DB
        $profilage = InscriptionProfilage::updateOrCreate(
            ['inscription_candidat_id' => $candidat->id],
            [
                'niveau'              => $niveau_ia,
                'rythme'              => $rythme_ia,
                'objectif'            => $objectif_ia,
                'disponibilite_hebdo' => $dispo_ia,
            ]
        );

        // Appel Flask
        try {
            $ia_endpoint = env('IA_URL', 'http://service-3-ia:5001/predict');
            $response = \Illuminate\Support\Facades\Http::timeout(90)->post($ia_endpoint, $iaPayload);

            if ($response->successful()) {
                $json = $response->json();
                $groupe = $json['groupe'] ?? $json['groupe_estime'] ?? null;
                if ($groupe) {
                    $profilage->groupe_estime = $groupe;
                    $profilage->save();
                }
                return response()->json([
                    'profilage' => $profilage,
                    'ia'        => $json,
                ]);
            }

            return response()->json([
                'message' => 'IA service error',
                'status'  => $response->status(),
                'body'    => $response->body(),
            ], 502);

        } catch (\Exception $e) {
            Log::warning('[AdminProfilage] IA predict failed: ' . $e->getMessage());
            return response()->json(['message' => 'IA service unreachable: ' . $e->getMessage()], 503);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Mappers – accepted model categories:
    //   niveau       : Débutant | Intermédiaire | Avancé
    //   rythme       : lent | modéré | rapide
    //   objectif     : Apprentissage | Révision | Certification | Perfectionnement
    //   disponibilite: faible | moyenne | élevée
    // ──────────────────────────────────────────────────────────────
    private function mapNiveau($raw): string
    {
        $map = [
            'débutant'      => 'Débutant',
            'debutant'      => 'Débutant',
            'debutant(e)'   => 'Débutant',
            'intermédiaire' => 'Intermédiaire',
            'intermediaire' => 'Intermédiaire',
            'intermediare'  => 'Intermédiaire',
            'avancé'        => 'Avancé',
            'avance'        => 'Avancé',
            'avancé(e)'     => 'Avancé',
            'expert'        => 'Avancé',
        ];
        return $map[mb_strtolower(trim((string) $raw), 'UTF-8')] ?? 'Intermédiaire';
    }

    private function mapRythme($raw): string
    {
        $map = [
            'lent'     => 'lent',
            'lente'    => 'lent',
            'lent(e)'  => 'lent',
            'modéré'   => 'modéré',
            'modere'   => 'modéré',
            'moyen'    => 'modéré',
            'normal'   => 'modéré',
            'flexible' => 'modéré',
            'rapide'   => 'rapide',
            'intensif' => 'rapide',
            'accelere' => 'rapide',
            'accéléré' => 'rapide',
        ];
        return $map[mb_strtolower(trim((string) $raw), 'UTF-8')] ?? 'modéré';
    }

    private function mapObjectif($raw): string
    {
        $map = [
            'apprentissage'        => 'Apprentissage',
            'apprendre'            => 'Apprentissage',
            'loisir'               => 'Apprentissage',
            'reconversion'         => 'Apprentissage',
            'revision'             => 'Révision',
            'révision'             => 'Révision',
            'revoir'               => 'Révision',
            'certification'        => 'Certification',
            'certif'               => 'Certification',
            'perfectionnement'     => 'Perfectionnement',
            'perfectionner'        => 'Perfectionnement',
            'montee_en_competence' => 'Perfectionnement',
            'projet_pro'           => 'Perfectionnement',
            'emploi'               => 'Apprentissage',
        ];
        return $map[mb_strtolower(trim((string) $raw), 'UTF-8')] ?? 'Apprentissage';
    }

    private function mapDispo($raw): string
    {
        $key = mb_strtolower(trim((string) $raw), 'UTF-8');

        if (is_numeric($key)) {
            $h = (int) $key;
            if ($h <= 5)  return 'faible';
            if ($h <= 15) return 'moyenne';
            return 'élevée';
        }

        $map = [
            'faible'  => 'faible',
            'low'     => 'faible',
            '1'       => 'faible',
            'moyenne' => 'moyenne',
            'medium'  => 'moyenne',
            'moyen'   => 'moyenne',
            '2'       => 'moyenne',
            'élevée'  => 'élevée',
            'elevee'  => 'élevée',
            'élevee'  => 'élevée',
            'high'    => 'élevée',
            'fort'    => 'élevée',
            '3'       => 'élevée',
        ];
        return $map[$key] ?? 'moyenne';
    }
}
