<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inscription_Candidat;
use App\Models\Inscription_Formateur;
use App\Models\Formation;
use App\Models\InscriptionProfilage;
use App\Models\Notification;

class InscriptionController extends Controller
{
    //
    public function showInscriptionCandidats(Request $request)
    {
        $query = Inscription_Candidat::with(['formation', 'profilage']);

        if ($request->has('page')) {
            $perPage = min((int) $request->input('per_page', 20), 100);
            $paginated = $query->paginate($perPage);
            $paginated->getCollection()->transform(function ($c) {
                $data = $c->toArray();
                if ($c->profilage) {
                    $profilageData = $c->profilage->toArray();
                    unset($profilageData['id'], $profilageData['created_at'], $profilageData['updated_at']);
                    $data = array_merge($data, $profilageData);
                }
                return $data;
            });
            return response()->json($paginated);
        }

        $candidats = $query->limit(200)->get();
        $formatted = $candidats->map(function ($c) {
            $data = $c->toArray();
            if ($c->profilage) {
                $profilageData = $c->profilage->toArray();
                unset($profilageData['id'], $profilageData['created_at'], $profilageData['updated_at']);
                $data = array_merge($data, $profilageData);
            }
            return $data;
        });

        return response()->json($formatted);
    }

    public function showInscriptionCandidat(Request $request)
    {
        $user_id = $request->attributes->get('user_id');
        // Attention: la table inscription__candidats n'a pas de user_id par défaut. 
        // Si cela génère une erreur SQL, remplacez par 'email' si pertinent.
        $candidats = Inscription_Candidat::with(['formation', 'profilage'])->where('user_id', $user_id)->get();
        
        $formatted = $candidats->map(function($c) {
            $data = $c->toArray();
            if ($c->profilage) {
                $profilageData = $c->profilage->toArray();
                unset($profilageData['id'], $profilageData['created_at'], $profilageData['updated_at']);
                $data = array_merge($data, $profilageData);
            }
            return $data;
        });

        return response()->json($formatted);
    }

    public function getCandidatsByFormation($formationId)
    {
        $candidat = Inscription_Candidat::where('formation_id', $formationId)->get();
        if (!$candidat) {
            return response()->json(['message' => 'Candidat not found'], 404);
        }

        return response()->json($candidat);
    }

    public function showInscriptionFormateur(Request $request)
    {
        $user_id = $request->attributes->get('user_id');
        $formateurs = Inscription_Formateur::where('user_id', $user_id)->get();
        return response()->json($formateurs);
    }

    public function showInscriptionFormateurs(Request $request)
    {
        if ($request->has('page')) {
            $perPage = min((int) $request->input('per_page', 20), 100);
            return response()->json(Inscription_Formateur::paginate($perPage));
        }
        return response()->json(Inscription_Formateur::limit(200)->get());
    }

    public function createInscriptionCandidat(Request $request)
    {
        $request->validate([
            'nom'          => 'required|string|max:100',
            'prenom'       => 'required|string|max:100',
            'email'        => 'required|email|max:255',
            'formation_id' => 'required|integer|exists:formations,id',
            'telephone'    => 'nullable|string|max:20',
            'niveau'       => 'nullable|string|max:50',
        ]);

        $data = $request->all();

        if (isset($data['etat_civil'])) {
            $data['état_civil'] = $data['etat_civil'];
            unset($data['etat_civil']);
        }

        $candidat = Inscription_Candidat::create($data);

        // ── Notification admin ──
        Notification::create([
            'user_id' => 0,
            'title'   => 'Nouvelle demande d\'inscription',
            'message' => "{$candidat->prenom} {$candidat->nom} vient de s'inscrire à une formation. En attente de validation.",
            'type'    => 'info',
            'role'    => 'admin',
            'is_read' => false,
            'link'    => '/dashboard/admin/demandes',
        ]);

        // ── Notification formateur propriétaire ──
        $formation = Formation::find($candidat->formation_id);
        if ($formation && $formation->id_formateur) {
            Notification::create([
                'user_id' => $formation->id_formateur,
                'title'   => 'Nouvelle demande sur votre formation',
                'message' => "{$candidat->prenom} {$candidat->nom} s'est inscrit à \"{$formation->title}\". En attente de validation par l'admin.",
                'type'    => 'info',
                'role'    => 'formateur',
                'is_read' => false,
                'link'    => '/dashboard/formateur/demandes',
            ]);
        }

        return response()->json([
            'message' => 'Inscription enregistrée avec succès',
            'candidat' => $candidat,
        ], 201);
    }

    // ── Toutes les demandes d'inscription pour les formations d'un formateur ──
    public function demandesFormateur($formateur_id)
    {
        $formationIds = Formation::where('id_formateur', $formateur_id)->pluck('id');

        $inscriptions = Inscription_Candidat::with('formation')
            ->whereIn('formation_id', $formationIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($inscriptions);
    }

    // ── Marquer une demande comme vue par le formateur ──
    public function markVueFormateur(Request $request, $id)
    {
        $user_id = $request->attributes->get('user_id');
        $inscription = Inscription_Candidat::with('formation')->findOrFail($id);

        if ($inscription->formation && (int)$inscription->formation->id_formateur === (int)$user_id) {
            $inscription->vue_formateur = true;
            $inscription->save();
            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Non autorisé'], 403);
    }

    /**
     * Déclenché par l'admin après acceptation :
     * Crée (ou met à jour) le profilage IA avec les 4 champs clés
     * et appelle le service-3-ia pour obtenir le groupe_estime.
     */
    public function createProfilageAdmin(Request $request, $id)
    {
        $candidat = Inscription_Candidat::findOrFail($id);

        $niveau_raw   = $candidat->niveau;
        $rythme_raw   = $candidat->rythme;
        $objectif_raw = $candidat->objectif;
        $dispo_raw    = $candidat->disponibilite_hebdo;

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

        // Créer ou mettre à jour le profilage avec valeurs normalisées
        $profilage = InscriptionProfilage::updateOrCreate(
            ['inscription_candidat_id' => $candidat->id],
            [
                'niveau'              => $niveau_ia,
                'rythme'              => $rythme_ia,
                'objectif'            => $objectif_ia,
                'disponibilite_hebdo' => $dispo_ia,
            ]
        );

        // Appeler le service-3-ia avec les 4 champs exacts
        try {
            \Log::info('[InscriptionCtrl] IA payload', $iaPayload);

            $iaResponse = \Illuminate\Support\Facades\Http::timeout(10)
                ->post(env('IA_URL', 'http://service-3-ia:5001/predict'), $iaPayload);

            if ($iaResponse->successful()) {
                $groupe = $iaResponse->json('groupe') ?? $iaResponse->json('groupe_estime') ?? null;
                if ($groupe) {
                    $profilage->groupe_estime = $groupe;
                    $profilage->save();
                }
            } else {
                \Log::warning('[InscriptionCtrl] IA error ' . $iaResponse->status() . ': ' . $iaResponse->body());
            }
        } catch (\Exception $e) {
            \Log::warning('[InscriptionCtrl] Service IA indisponible : ' . $e->getMessage());
        }

        return response()->json([
            'message'   => 'Profilage IA créé avec succès',
            'profilage' => $profilage,
        ]);
    }

    // ── Mappers partagés (mêmes règles que AdminProfilageController) ──
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
       
    public function createInscriptionFormateur(Request $request)
    {
        $formateur = Inscription_Formateur::create($request->all());
        return response()->json($formateur, 201);
    }

    public function updateInscriptionCandidat(Request $request, $id)
    {
        $candidat = Inscription_Candidat::findOrFail($id);
        $candidat->update($request->all());
        return response()->json($candidat);
    }

    public function updateInscriptionFormateur(Request $request, $id)
    {
        $formateur = Inscription_Formateur::findOrFail($id);
        $formateur->update($request->all());
        return response()->json($formateur);
    }

    public function getCandidatsByFormateur($formateurId){
        $id_formation = Formation::where('id_formateur', $formateurId)->get('id');
        $candidats = Inscription_Candidat::whereIn('formation_id', $id_formation)->get();
        return response()->json($candidats);

    }

    public function deleteInscriptionCandidat($id)
    {
        $candidat = Inscription_Candidat::findOrFail($id);
        $candidat->delete();
        return response()->json(null, 204);
    }

    public function deleteInscriptionFormateur($id)
    {
        $formateur = Inscription_Formateur::findOrFail($id);
        $formateur->delete();
        return response()->json(null, 204);
    }

    public function accepterCandidat($id)
    {
        $candidat = Inscription_Candidat::with('formation')->findOrFail($id);
        $candidat->statut = 'accepte';
        $candidat->save();

        // ── Notification formateur : candidat accepté, visible dans Mes Formations ──
        if ($candidat->formation && $candidat->formation->id_formateur) {
            Notification::create([
                'user_id' => $candidat->formation->id_formateur,
                'title'   => 'Candidat accepté ✓',
                'message' => "{$candidat->prenom} {$candidat->nom} a été accepté pour \"{$candidat->formation->title}\". Il apparaît maintenant dans vos stagiaires.",
                'type'    => 'success',
                'role'    => 'formateur',
                'is_read' => false,
                'link'    => "/formateur/mes-formations/{$candidat->formation_id}",
            ]);
        }

        return response()->json([
            'message' => 'Candidat accepté avec succès',
            'data'    => $candidat,
        ]);
    }

    public function refuserCandidat($id)
    {
        $candidat = Inscription_Candidat::with('formation')->findOrFail($id);
        $candidat->statut = 'refuse';
        $candidat->save();

        // ── Notification formateur : candidat refusé ──
        if ($candidat->formation && $candidat->formation->id_formateur) {
            Notification::create([
                'user_id' => $candidat->formation->id_formateur,
                'title'   => 'Candidat refusé',
                'message' => "{$candidat->prenom} {$candidat->nom} a été refusé pour \"{$candidat->formation->title}\".",
                'type'    => 'warning',
                'role'    => 'formateur',
                'is_read' => false,
                'link'    => '/dashboard/formateur/demandes',
            ]);
        }

        return response()->json([
            'message' => 'Candidat refusé avec succès',
            'data'    => $candidat,
        ]);
    }

    public function accepterFormateur($id)
    {
        $formateur = Inscription_Formateur::findOrFail($id);
        $formateur->statut = 'accepte';
        $formateur->save();
        return response()->json($formateur);
    }

    public function refuserFormateur($id)
    {
        $formateur = Inscription_Formateur::findOrFail($id);
        $formateur->statut = 'refuse';
        $formateur->save();
        return response()->json($formateur);
    }
    
    public function statsStagiaire($user_id)
    {
        // Récupère l'email depuis public.users (DB partagée)
        $user = \DB::selectOne('SELECT id, name, email FROM public.users WHERE id = ?', [(int)$user_id]);

        if (!$user) {
            return response()->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $inscriptions = Inscription_Candidat::with('formation')
            ->where('email', $user->email)
            ->get();

        $total      = $inscriptions->count();
        $acceptees  = $inscriptions->where('statut', 'accepte')->count();
        $enAttente  = $inscriptions->where('statut', 'en_attente')->count();
        $refuses    = $inscriptions->where('statut', 'refuse')->count();

        $avgTech = $inscriptions->count() > 0
            ? round($inscriptions->avg('score_technique'), 1) : 0;
        $avgSoft = $inscriptions->count() > 0
            ? round($inscriptions->avg('score_soft_skills'), 1) : 0;

        $formations = $inscriptions->map(fn($i) => [
            'id'               => $i->id,
            'formation_title'  => $i->formation?->title ?? 'Formation',
            'statut'           => $i->statut,
            'score_technique'  => (int)$i->score_technique,
            'score_soft_skills'=> (int)$i->score_soft_skills,
            'created_at'       => $i->created_at,
        ])->values();

        return response()->json([
            'user'                  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'total_inscriptions'    => $total,
            'acceptees'             => $acceptees,
            'en_attente'            => $enAttente,
            'refuses'               => $refuses,
            'avg_score_technique'   => $avgTech,
            'avg_score_soft_skills' => $avgSoft,
            'formations'            => $formations,
        ]);
    }

    public function formationsStagiaire($user_id)
    {
        $user = \DB::selectOne('SELECT id, name, email FROM public.users WHERE id = ?', [(int)$user_id]);
        if (!$user) return response()->json(['error' => 'Utilisateur non trouvé'], 404);

        $inscriptions = Inscription_Candidat::with('formation')
            ->where('email', $user->email)
            ->orderBy('created_at', 'desc')
            ->get();

        $formations = $inscriptions->map(fn($i) => [
            'inscription_id'     => $i->id,
            'formation_id'       => $i->formation_id,
            'title'              => $i->formation?->title ?? 'Formation',
            'description'        => $i->formation?->description ?? '',
            'domaine'            => $i->formation?->domaine ?? null,
            'niveau'             => $i->formation?->niveau ?? null,
            'duree'              => $i->formation?->duree ?? null,
            'prix'               => $i->formation?->prix ?? null,
            'nom_formateur'      => $i->formation?->nom_formateur ?? null,
            'date_debut'         => $i->formation?->date_debut ?? null,
            'date_fin'           => $i->formation?->date_fin ?? null,
            'statut_formation'   => $i->formation?->statut ?? null,
            'statut_inscription' => $i->statut,
            'score_technique'    => (int)$i->score_technique,
            'score_soft_skills'  => (int)$i->score_soft_skills,
            'inscrit_le'         => $i->created_at,
        ])->values();

        return response()->json([
            'user'       => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'formations' => $formations,
            'total'      => $formations->count(),
        ]);
    }

    public function getCandidatsByStatut($statut)
    {
        $candidats = Inscription_Candidat::where('statut', $statut)->get();
        return response()->json($candidats);
    }

    public function getFormateursByStatut($statut)
    {
        $formateurs = Inscription_Formateur::where('statut', $statut)->get();
        return response()->json($formateurs);
    }

    public function telechargerCV($id, $type)
    {
        if ($type === 'candidat') {
            $inscription = Inscription_Candidat::findOrFail($id);
        } elseif ($type === 'formateur') {
            $inscription = Inscription_Formateur::findOrFail($id);
        } else {
            return response()->json(['error' => 'Type invalide'], 400);
        }

        $cvPath = storage_path('app/' . $inscription->cv);

        if (!file_exists($cvPath)) {
            return response()->json(['error' => 'CV non trouvé'], 404);
        }

        return response()->download($cvPath);
    }


}
