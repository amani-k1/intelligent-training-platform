<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Financier_Formateur;
use App\Models\Financier_Candidat;

class FinancierController extends Controller
{
    //
    public function showFinancierFormateurs(){
        $financierFormateur = Financier_Formateur::all();
        return response()->json($financierFormateur);
    }

    public function showFinancierCandidats(){
        $financierCandidat = Financier_Candidat::all();
        return response()->json($financierCandidat);
    }

    public function showFinancierFormateur($id){
        $financierFormateur = Financier_Formateur::where('user_id', $id)->get();
        return response()->json($financierFormateur);
    }

    public function showFinancierCandidat($id){
        $financierCandidat = Financier_Candidat::where('user_id', $id)->get();
        return response()->json($financierCandidat);
    }

    public function archiverFinancierFormateur($id){
        $financierFormateur = Financier_Formateur::findOrFail($id);
        $financierFormateur->delete();
        return response()->json(['message' => 'Financier formateur archivé']);
    }

    public function archiverFinancierCandidat($id){
        $financierCandidat = Financier_Candidat::findOrFail($id);
        $financierCandidat->delete();
        return response()->json(['message' => 'Financier candidat archivé']);
    }

    public function restaurerFinancierFormateur($id){
        $financierFormateur = Financier_Formateur::withTrashed()->findOrFail($id);
        $financierFormateur->restore();
        return response()->json(['message' => 'Financier formateur restauré']);
    }

    public function restaurerFinancierCandidat($id){
        $financierCandidat = Financier_Candidat::withTrashed()->findOrFail($id);
        $financierCandidat->restore();
        return response()->json(['message' => 'Financier candidat restauré']);
    }

    public function AjouterFinancierFormateur(Request $request, $id, $id_F){
        $financierFormateur = Financier_Formateur::create([
            'user_id' => $id,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'etat_payment' => $request->etat_payment,
            'mode_payment' => $request->mode_payment,
            'montant' => $request->montant,
            'avance' => $request->avance,
            'rest_a_payer' => $request->rest_a_payer,
            'FormationRealise_id' => $id_F
        ]);
        return response()->json(['message' => 'Financier formateur ajouté', 'data' => $financierFormateur]);
    }

    public function AjouterFinancierCandidat(Request $request, $id, $id_F){
        $financierCandidat = Financier_Candidat::create([
            'user_id' => $id,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'etat_payment' => $request->etat_payment,
            'mode_payment' => $request->mode_payment,
            'montant' => $request->montant,
            'avance' => $request->avance,
            'rest_a_payer' => $request->rest_a_payer,
            'FormationRealise_id' => $id_F
        ]);
        return response()->json(['message' => 'Financier candidat ajouté', 'data' => $financierCandidat]);
    }

}
