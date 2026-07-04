<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Formation;
use App\Models\FormationRealise;
use App\Models\Inscription_Candidat;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;



class FormationController extends Controller
{
    //
    public function showFormationsFormateur($user_id)
    {
        $formations = Formation::where('id_formateur', $user_id)
            ->withCount([
                'inscriptionCandidats as stagiaires_count',
                'inscriptionCandidats as acceptes_count' => fn($q) => $q->where('statut', 'accepte'),
            ])
            ->get();

        return response()->json($formations);
    }

    public function getStatsFormateur($user_id)
    {
        $formations = Formation::where('id_formateur', $user_id)
            ->withCount([
                'inscriptionCandidats as stagiaires_count',
                'inscriptionCandidats as acceptes_count' => fn($q) => $q->where('statut', 'accepte'),
            ])
            ->get();

        $actives   = $formations->where('statut', 'En cours')->count();
        $completes = $formations->where('statut', 'Complet')->count();
        $total     = $formations->count();

        $totalHeures = (int) $formations->sum('duree');
        $totalPlaces = (int) $formations->sum('places_totales');

        $revenusPotentiels = $formations->sum(fn($f) => (float)($f->prix ?? 0) * (int)($f->places_totales ?? 0));

        // Revenus réels = prix × candidats acceptés
        $revenusReels = $formations->sum(fn($f) => (float)($f->prix ?? 0) * (int)($f->acceptes_count ?? 0));

        $domaines = $formations->pluck('domaine')->filter()->unique()->values();
        $taux     = $total > 0 ? (int) round(($actives / $total) * 100) : 0;

        // Note moyenne = avg(score_technique) / 20  (scale 0-100 → 0-5)
        $formationIds = $formations->pluck('id');
        $avgScore = Inscription_Candidat::whereIn('formation_id', $formationIds)
            ->whereNotNull('score_technique')
            ->avg('score_technique');
        $noteMoyenne = $avgScore ? round($avgScore / 20, 1) : 0;

        // Total vrais inscrits (somme des candidats acceptés + en attente)
        $totalStagiaires = $formations->sum('stagiaires_count');
        $totalAcceptes   = $formations->sum('acceptes_count');

        $tauxCompletion = $totalStagiaires > 0
            ? round(($totalAcceptes / $totalStagiaires) * 100, 1)
            : 0;

        // ── DONNÉES GRAPHIQUES ─────────────────────────────────────────

        // 1. Students by Course — top 5 formations par nombre d'inscrits
        $studentsByCourse = $formations
            ->sortByDesc('stagiaires_count')
            ->take(5)
            ->map(fn($f) => [
                'name'     => mb_strlen($f->title) > 13
                    ? mb_substr($f->title, 0, 13) . '…'
                    : $f->title,
                'students' => (int) $f->stagiaires_count,
            ])
            ->values();

        // 2. Weekly Engagement — inscriptions par jour de semaine (4 dernières semaines)
        $recentInscriptions = Inscription_Candidat::whereIn('formation_id', $formationIds)
            ->where('created_at', '>=', Carbon::now()->subWeeks(4))
            ->get();

        $dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $engMap   = array_fill_keys($dayOrder, 0);
        foreach ($recentInscriptions as $ins) {
            $day = Carbon::parse($ins->created_at)->format('D');
            if (isset($engMap[$day])) $engMap[$day]++;
        }
        $weeklyEngagement = collect($dayOrder)->map(fn($d) => [
            'name' => $d, 'active' => $engMap[$d],
        ])->values();

        // 3. Rating Distribution — score_technique en catégories d'étoiles
        $allScores = Inscription_Candidat::whereIn('formation_id', $formationIds)
            ->whereNotNull('score_technique')
            ->pluck('score_technique');

        $ratingBuckets = ['5 Stars' => 0, '4 Stars' => 0, '3 Stars' => 0, '2 Stars' => 0];
        foreach ($allScores as $s) {
            if ($s >= 80)     $ratingBuckets['5 Stars']++;
            elseif ($s >= 60) $ratingBuckets['4 Stars']++;
            elseif ($s >= 40) $ratingBuckets['3 Stars']++;
            else              $ratingBuckets['2 Stars']++;
        }
        $ratingDistribution = collect($ratingBuckets)->map(fn($v, $k) => [
            'name' => $k, 'value' => $v,
        ])->values();

        // 4. Performance Trend — score moyen par semaine (6 dernières semaines)
        $sixWeeksAgo = Carbon::now()->startOfWeek()->subWeeks(5);
        $perfInscriptions = Inscription_Candidat::whereIn('formation_id', $formationIds)
            ->whereNotNull('score_technique')
            ->where('created_at', '>=', $sixWeeksAgo)
            ->get();

        $perfMap = [];
        for ($i = 0; $i < 6; $i++) {
            $perfMap['Sem ' . ($i + 1)] = [];
        }
        foreach ($perfInscriptions as $ins) {
            $weekNum = (int) Carbon::parse($ins->created_at)->startOfWeek()->diffInWeeks($sixWeeksAgo) + 1;
            $key = 'Sem ' . min($weekNum, 6);
            if (isset($perfMap[$key])) {
                $perfMap[$key][] = (float) $ins->score_technique;
            }
        }
        $performanceTrend = collect($perfMap)->map(fn($scores, $name) => [
            'name'  => $name,
            'score' => count($scores) > 0 ? round(array_sum($scores) / count($scores), 1) : 0,
        ])->values();

        return response()->json([
            'formations_actives'   => $actives,
            'formations_completes' => $completes,
            'formations_brouillon' => $formations->where('statut', 'Brouillon')->count(),
            'total_formations'     => $total,
            'total_heures'         => $totalHeures,
            'total_places'         => $totalPlaces,
            'revenus_potentiels'   => round($revenusPotentiels, 2),
            'revenus_reels'        => round($revenusReels, 2),
            'domaines'             => $domaines,
            'nb_domaines'          => $domaines->count(),
            'taux_actif'           => $taux,
            'taux_completion'      => $tauxCompletion,
            'note_moyenne'         => $noteMoyenne,
            'total_stagiaires'     => $totalStagiaires,
            'total_acceptes'       => $totalAcceptes,
            // données graphiques
            'students_by_course'   => $studentsByCourse,
            'weekly_engagement'    => $weeklyEngagement,
            'rating_distribution'  => $ratingDistribution,
            'performance_trend'    => $performanceTrend,
        ]);
    }

    public function showFormations(Request $request)
    {
        if ($request->has('page')) {
            $perPage = min((int) $request->input('per_page', 20), 100);
            return response()->json(Formation::paginate($perPage));
        }

        return response()->json(Formation::limit(200)->get());
    }



    public function createFormation(Request $request)
    {
        $raw = $request->getContent();
        $data = $raw ? (json_decode($raw, true) ?? []) : [];
        if (empty($data)) {
            $data = $request->all();
        }

        if (empty($data['title']) && !empty($data['titre'])) {
            $data['title'] = $data['titre'];
            unset($data['titre']);
        }

        $validator = \Validator::make($data, [
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'domaine'        => 'required|string|max:100',
            'niveau'         => 'required|in:Débutant,Intermédiaire,Avancé',
            'prix'           => 'required|numeric|min:0',
            'places_totales' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (empty($data['id_formateur'])) {
            $data['id_formateur'] = $request->attributes->get('user_id');
        }
        if (empty($data['nom_formateur'])) {
            $data['nom_formateur'] = $request->attributes->get('email') ?? '';
        }

        $formation = Formation::create($data);
        return response()->json($formation, 201);
    }


    public function updateFormation(Request $request, $id)
    {
        $formation = Formation::findOrFail($id);

        $role = $request->attributes->get('role');
        if ($role === 'formateur' && (string)$formation->id_formateur !== (string)$request->attributes->get('user_id')) {
            return response()->json(['message' => 'Non autorisé : ce n\'est pas votre formation.'], 403);
        }

        $raw = $request->getContent();
        $data = $raw ? (json_decode($raw, true) ?? []) : [];
        if (empty($data)) {
            $data = $request->all();
        }

        if (empty($data['title']) && !empty($data['titre'])) {
            $data['title'] = $data['titre'];
            unset($data['titre']);
        }

        $formation->update($data);
        return response()->json($formation);
    }

    public function deleteFormation(Request $request, $id)
    {
        $formation = Formation::findOrFail($id);

        // Un formateur ne peut supprimer que ses propres formations
        $role = $request->attributes->get('role');
        if ($role === 'formateur' && (string)$formation->id_formateur !== (string)$request->attributes->get('user_id')) {
            return response()->json(['message' => 'Non autorisé : ce n\'est pas votre formation.'], 403);
        }

        $formation->delete();
        return response()->json(['message' => 'Formation supprimée']);
    }

    public function showFormation($id)
    {
        $formation = Formation::withCount([
            'inscriptionCandidats as stagiaires_count',
            'inscriptionCandidats as acceptes_count' => fn($q) => $q->where('statut', 'accepte'),
            'inscriptionCandidats as en_attente_count' => fn($q) => $q->where('statut', 'en_attente'),
        ])->find($id);

        if (!$formation) {
            return response()->json(['message' => 'Formation not found'], 404);
        }

        return response()->json($formation);
    }

    public function exportCSV($user_id)
    {
        $formations = Formation::where('id_formateur', $user_id)
            ->withCount([
                'inscriptionCandidats as stagiaires_count',
                'inscriptionCandidats as acceptes_count'   => fn($q) => $q->where('statut', 'accepte'),
                'inscriptionCandidats as en_attente_count' => fn($q) => $q->where('statut', 'en_attente'),
                'inscriptionCandidats as refuses_count'    => fn($q) => $q->where('statut', 'refuse'),
            ])
            ->get();

        $rows = [];
        $rows[] = implode(';', ['ID', 'Titre', 'Domaine', 'Niveau', 'Durée (h)', 'Prix (DZD)',
            'Places', 'Statut', 'Inscrits', 'Acceptés', 'En attente', 'Refusés',
            'Revenus réels (DZD)', 'Date début', 'Date fin', 'Créée le']);

        foreach ($formations as $f) {
            $revenus = (float)($f->prix ?? 0) * (int)($f->acceptes_count ?? 0);
            $rows[] = implode(';', [
                $f->id,
                '"' . str_replace('"', '""', $f->title) . '"',
                $f->domaine ?? '',
                $f->niveau ?? '',
                $f->duree ?? 0,
                $f->prix ?? 0,
                $f->places_totales ?? 0,
                $f->statut ?? '',
                $f->stagiaires_count ?? 0,
                $f->acceptes_count ?? 0,
                $f->en_attente_count ?? 0,
                $f->refuses_count ?? 0,
                $revenus,
                $f->date_debut ?? '',
                $f->date_fin ?? '',
                $f->created_at ? $f->created_at->format('d/m/Y') : '',
            ]);
        }

        $csv = "\xEF\xBB\xBF" . implode("\n", $rows); // BOM UTF-8 pour Excel

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="mes-formations-' . date('Y-m-d') . '.csv"',
        ]);
    }

    public function searchFormations(Request $request)
    {
        $query = $request->input('query');
        $formations = Formation::where('title', 'like', "%$query%")
            ->orWhere('description', 'like', "%$query%")
            ->get();

        return response()->json($formations);
    }

    public function filterFormations(Request $request)
    {
        $statut = $request->input('status') ?? $request->input('statut');
        $formations = Formation::where('statut', $statut)->get();

        return response()->json($formations);
    }

    public function showFormationsRealises()
    {
        $formationsRealises = FormationRealise::all();
        if (!$formationsRealises) {
            return response()->json(['message' => 'Aucune formation réalisée trouvée'], 404);
        }
        return response()->json($formationsRealises);
    }




    public function createFormationRealise(Request $request)
    {
        $formationRealiseExist = FormationRealise::where('formation', $request->formation)
            ->where('formateur', $request->formateur)
            ->where('date_realisation', $request->date_realisation)
            ->first();
        if ($formationRealiseExist) {
            return response()->json(['message' => 'Formation réalisée déjà existante'], 400);
        }

        $formationRealise = FormationRealise::create($request->all());

        return response()->json($formationRealise);
    }


    public function downloadPDF()
    {
        $formations = FormationRealise::all();

        $html = '
        <h2>Liste des formations réalisées</h2>
        <table border="1" width="100%" cellpadding="5">
            <thead>
                <tr>
                    <th>Formation</th>
                    <th>Formateur</th>
                    <th>Participants</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($formations as $f) {
            $html .= '
            <tr>
                <td>' . $f->formation . '</td>
                <td>' . $f->formateur . '</td>
                <td>' . $f->nbr_participants . '</td>
                <td>' . $f->date_realisation . '</td>
            </tr>';
        }

        $html .= '</tbody></table>';

        $pdf = Pdf::loadHTML($html);

        return response($pdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="formations.pdf"');
    }
}
