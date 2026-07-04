<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AIController extends Controller
{
    /**
     * Get all AI Exploitation dashboard data
     */
    public function getDashboardData()
    {
        // Simulation de récupération de données depuis la DB
        // Normalement, vous feriez :
        // $alerts = DB::table('ai_alerts')->orderBy('created_at', 'desc')->take(10)->get();
        // $matchings = DB::table('ai_matchings')->orderBy('created_at', 'desc')->take(10)->get();
        
        $alerts = [
            ['id' => 1, 'date' => '2024-06-15', 'query' => 'formation Python avancé', 'near' => 'Python débutant', 'nearId' => 101, 'similarity' => 0.58],
            ['id' => 2, 'date' => '2024-06-14', 'query' => 'cours IA gratuits', 'near' => 'Data Science', 'nearId' => 102, 'similarity' => 0.62],
            ['id' => 3, 'date' => '2024-06-12', 'query' => 'UI/UX avancé', 'near' => 'UI/UX Design', 'nearId' => 103, 'similarity' => 0.55],
            ['id' => 4, 'date' => '2024-06-16', 'query' => 'React architecture', 'near' => 'React Pro', 'nearId' => 104, 'similarity' => 0.68],
        ];

        $matchings = [
            [
                'id' => 1, 'date' => '15/06/2024', 'client' => 'Jean Dupont', 'level' => 'Débutant', 'objective' => 'Reconversion', 'group' => 'engagement_faible',
                'probabilities' => ['engagement_faible' => 0.85, 'engagement_moyen' => 0.10, 'engagement-elevé' => 0.05]
            ],
            [
                'id' => 2, 'date' => '14/06/2024', 'client' => 'Sarah Mansouri', 'level' => 'Interméd.', 'objective' => 'Perfectionnement', 'group' => 'engagement_moyen',
                'probabilities' => ['engagement_moyen' => 0.92, 'engagement-elevé' => 0.05, 'engagement_faible' => 0.03]
            ],
            [
                'id' => 3, 'date' => '12/06/2024', 'client' => 'Karim Bensalem', 'level' => 'Avancé', 'objective' => 'Certification', 'group' => 'engagement-elevé',
                'probabilities' => ['engagement-elevé' => 0.78, 'engagement_moyen' => 0.15, 'engagement_faible' => 0.07]
            ],
        ];

        $chart = [
            ['day' => 'Lun', 'matchings' => 12, 'alertes' => 5],
            ['day' => 'Mar', 'matchings' => 18, 'alertes' => 3],
            ['day' => 'Mer', 'matchings' => 15, 'alertes' => 8],
            ['day' => 'Jeu', 'matchings' => 25, 'alertes' => 4],
            ['day' => 'Ven', 'matchings' => 22, 'alertes' => 6],
            ['day' => 'Sam', 'matchings' => 30, 'alertes' => 2],
            ['day' => 'Dim', 'matchings' => 28, 'alertes' => 3],
        ];

        return response()->json([
            'alerts' => $alerts,
            'matchings' => $matchings,
            'chart' => $chart,
            'stats' => [
                'uptime' => '99.8%',
                'responseTime' => '0.32s',
                'totalMatchings' => 1245
            ]
        ]);
    }
}
