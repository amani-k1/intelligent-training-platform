<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\InscriptionFormationController;
use App\Http\Controllers\RechercheController;
use App\Http\Controllers\InscriptionController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\FinancierController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\InscriptionProfilageController;
use App\Http\Controllers\AdminProfilageController;
// Routes for formations
Route::get('/formations', [FormationController::class, 'showFormations']);
Route::get('/formations/formateur/{id}', [FormationController::class, 'showFormationsFormateur']);
Route::get('/formations/formateur/{id}/stats', [FormationController::class, 'getStatsFormateur']);
Route::get('/formations/formateur/{id}/export-csv', [FormationController::class, 'exportCSV']);
Route::get('/formations/formateur/{id}/demandes', [InscriptionController::class, 'demandesFormateur']);
Route::get('/formations/search', [FormationController::class, 'searchFormations']);
Route::get('/formations/filter', [FormationController::class, 'filterFormations']);
Route::get('/formations/{id}', [FormationController::class, 'showFormation']);
// Admin & Formateur peuvent créer/modifier/supprimer leurs formations
Route::middleware(['jwt', 'role:admin,formateur'])->group(function () {
    Route::post('/formations', [FormationController::class, 'createFormation']);
    Route::put('/formations/{id}', [FormationController::class, 'updateFormation']);
    Route::delete('/formations/{id}', [FormationController::class, 'deleteFormation']);
});
Route::middleware('jwt')->group(function () {
    // Routes inscriptions for candidats
    Route::post('/inscriptions/candidats', [InscriptionController::class, 'createInscriptionCandidat']);
    Route::put('/inscriptions/candidats/{id}', [InscriptionController::class, 'updateInscriptionCandidat']);
    Route::get('/inscriptions/candidats/{user_id}', [InscriptionController::class, 'showInscriptionCandidat']);
    Route::delete('/inscriptions/candidats/{id}', [InscriptionController::class, 'deleteInscriptionCandidat']);
    // Formateur marque une demande comme vue
    Route::patch('/inscriptions/candidats/{id}/vue', [InscriptionController::class, 'markVueFormateur']);
});





Route::apiResource('badges', BadgeController::class);
Route::get('badges/{badge}/learners', [BadgeController::class, 'learners']);
Route::post('badges/{badge}/assign', [BadgeController::class, 'assign']);
Route::delete('badges/{badge}/assign/{assignment}', [BadgeController::class, 'revoke']);



Route::get('/formateurs/{id}/candidats', [InscriptionController::class, 'getCandidatsByFormateur']);

// Routes for liste candidats d'une formation
Route::get('/formations/{id}/candidats', [InscriptionController::class, 'getCandidatsByFormation']);

Route::get('/candidats/statut/{statut}', [InscriptionController::class, 'getCandidatsByStatut']);
Route::get('/formateurs/statut/{statut}', [InscriptionController::class, 'getFormateursByStatut']);
// Routes personnalisées (recherche et inscription) – sans middleware jwt pour l'instant
Route::post('/rechercher', [RechercheController::class, 'search']);
Route::post('/inscription-formation', [InscriptionFormationController::class, 'store']);

// Admin routes via gateway paths — deux préfixes possibles selon la config Nginx
Route::middleware(['jwt', 'role:admin'])->group(function () {
    Route::post('/app/admin/formations', [FormationController::class, 'createFormation']);
    Route::post('/admin/formations', [FormationController::class, 'createFormation']);
});

// Also expose the app-prefixed list endpoint used by the frontend via gateway
Route::get('/app/formations', [FormationController::class, 'showFormations']);

Route::get('/telecharger-cv/{id}/{type}', [InscriptionController::class, 'telechargerCV']);

// Endpoint pour inscription avec profilage (Frontend -> Service-2)
Route::post('/inscriptions', [InscriptionProfilageController::class, 'store']);
Route::get('/inscriptions', [InscriptionProfilageController::class, 'index']);
Route::get('/inscriptions/{id}', [InscriptionProfilageController::class, 'show']);

// Routes inscriptions for formateurs
Route::middleware(['jwt', 'role:formateur'])->group(function () {
    Route::post('/inscriptions/formateurs', [InscriptionController::class, 'createInscriptionFormateur']);
    Route::put('/inscriptions/formateurs/{id}', [InscriptionController::class, 'updateInscriptionFormateur']);
    Route::get('/inscriptions/formateurs/{user_id}', [InscriptionController::class, 'showInscriptionFormateur']);
    Route::delete('/inscriptions/formateurs/{id}', [InscriptionController::class, 'deleteInscriptionFormateur']);
});

// Stats stagiaire par user_id (accès public — l'id vient de l'URL)
Route::get('/stagiaire/{id}/stats', [InscriptionController::class, 'statsStagiaire']);
// Formations détaillées du stagiaire (avec dates, formateur, domaine...)
Route::get('/stagiaire/{id}/formations', [InscriptionController::class, 'formationsStagiaire']);

Route::get('/demandes/candidats', [InscriptionController::class, 'showInscriptionCandidats']);
Route::get('/demandes/formateurs', [InscriptionController::class, 'showInscriptionFormateurs']);
Route::post('/demandes/candidats/accepter/{id}', [InscriptionController::class, 'accepterCandidat']);
Route::post('/demandes/formateurs/accepter/{id}', [InscriptionController::class, 'accepterFormateur']);
Route::post('/demandes/candidats/refuser/{id}', [InscriptionController::class, 'refuserCandidat']);
Route::post('/demandes/formateurs/refuser/{id}', [InscriptionController::class, 'refuserFormateur']);
// IA Exploitation (admin)
Route::middleware(['jwt', 'role:admin'])->prefix('ia')->group(function () {
    Route::get('/alertes', function () {
        return \App\Models\Alerte::orderBy('created_at', 'desc')->get();
    });
    Route::delete('/alertes/{id}', function ($id) {
        \App\Models\Alerte::findOrFail($id)->delete();
        return response()->json(['message' => 'Alerte supprimée']);
    });
    Route::post('/alertes/bulk-delete', function (\Illuminate\Http\Request $request) {
        \App\Models\Alerte::whereIn('id', $request->ids)->delete();
        return response()->json(['message' => count($request->ids) . ' alertes supprimées']);
    });
    Route::patch('/alertes/{id}/archive', function ($id) {
        $alerte = \App\Models\Alerte::findOrFail($id);
        $alerte->update(['archived' => !$alerte->archived]);
        return response()->json($alerte);
    });
    Route::post('/alertes/bulk-archive', function (\Illuminate\Http\Request $request) {
        \App\Models\Alerte::whereIn('id', $request->ids)->update(['archived' => true]);
        return response()->json(['message' => count($request->ids) . ' alertes archivées']);
    });
    Route::get('/matchings', function () {
        return \App\Models\InscriptionFormation::orderBy('created_at', 'desc')->limit(50)->get();
    });
    Route::get('/stats/matchings', function () {
        return \App\Models\InscriptionFormation::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')->orderBy('date')->get();
    });
    Route::get('/stats/alertes', function () {
        return \App\Models\Alerte::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')->orderBy('date')->get();
    });
    Route::get('/health', function () {
        $matching  = @fsockopen('service-3-ia', 5001)        ? 'online' : 'offline';
        $embedding = @fsockopen('service-4-embedding', 5002) ? 'online' : 'offline';
        return response()->json(['matching' => $matching, 'embedding' => $embedding]);
    });
});

// Admin: gestion des profilages + déclenchement IA
Route::middleware(['jwt', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/profilages', [AdminProfilageController::class, 'index']);
    Route::get('/profilages/{id}', [AdminProfilageController::class, 'show']);
    Route::post('/profilages/{id}/predict', [AdminProfilageController::class, 'predict']);
});

// Ensure gateway path /app/admin/profilages/... is accepted (gateway preserves 'app/' prefix)
Route::post('/app/admin/profilages/{id}/predict', [AdminProfilageController::class, 'predict'])
    ->middleware(['jwt', 'role:admin']);
// Routes for formations réalisées
Route::get('/formations/realises/pdf', [FormationController::class, 'downloadPDF']);
Route::post('/formations/realises', [FormationController::class, 'createFormationRealise']);
Route::get('/formations/realises', [FormationController::class, 'showFormationsRealises']);

// Routes for resources
Route::post('/resources', [ResourceController::class, 'uploadResource']);
Route::get('/resources', [ResourceController::class, 'getResource']);
Route::get('/resources/formation/{formation_id}', [ResourceController::class, 'getByFormation']);
Route::delete('/resources/delete/{id}', [ResourceController::class, 'dropResource']);
Route::get('/resources/download/{id}', [ResourceController::class, 'download']);

// Routes for financier
Route::get('/financiers/formateurs', [FinancierController::class, 'showFinancierFormateurs']);
Route::get('/financiers/formateur/{id}', [FinancierController::class, 'showFinancierFormateur']);
Route::delete('/financiers/formateurs/{id}', [FinancierController::class, 'archiverFinancierFormateur']);
Route::post('/financiers/formateurs/restaurer/{id}', [FinancierController::class, 'restaurerFinancierFormateur']);
Route::post('/financiers/formateur/ajouter/{id}/{id_F}', [FinancierController::class, 'AjouterFinancierFormateur']);

Route::get('/financiers/candidats', [FinancierController::class, 'showFinancierCandidats']);
Route::get('/financiers/candidat/{id}', [FinancierController::class, 'showFinancierCandidat']);
Route::post('/financiers/candidats/restaurer/{id}', [FinancierController::class, 'restaurerFinancierCandidat']);
Route::delete('/financiers/candidats/{id}', [FinancierController::class, 'archiverFinancierCandidat']);
Route::post('/financiers/candidat/ajouter/{id}/{id_F}', [FinancierController::class, 'AjouterFinancierCandidat']);




use App\Http\Controllers\Api\NotificationController;

// Protected routes (JWT)
Route::middleware(['jwt'])->group(function () {

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/archived', [NotificationController::class, 'archived']);
    Route::get('/notifications/role/{role}', [NotificationController::class, 'byRole']);
    Route::get('/notifications/type/{type}', [NotificationController::class, 'byType']);
    Route::get('/notifications/{id}', [NotificationController::class, 'show']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/{id}/archive', [NotificationController::class, 'archive']);
    Route::put('/notifications/{id}/restore', [NotificationController::class, 'restore']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::get('/notifications/{id}/pdf', [NotificationController::class, 'generatePDF']);
});
