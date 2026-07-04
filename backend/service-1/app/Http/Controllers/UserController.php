<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    //
    public function showFormateurs(){
        $formateurs = User::where('role', 'formateur')->get();
        return response()->json($formateurs);

    } 

    public function showCandidats(){
        $candidats = User::where('role', 'candidat')->get();
        return response()->json($candidats);

    }

    public function AddFormateur(request $request){
        $formateur = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'profile_picture' => $request->profile_picture,
            'status' => $request->status,
            'role' => 'formateur',
        ]);
        return response("formateur ajouté avec succès");

    }

    public function AddCandidat(request $request){
        $candidat = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'profile_picture' => $request->profile_picture,
            'status' => $request->status,
            'role' => 'candidat',
        ]);
        return response("candidat ajouté avec succès");

    }

    public function deleteUser($id){
        $user = User::find($id);
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimer avec succès']);
    }

    public function updateUser(request $request, $id){
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }
        // Ne mettre à jour que les champs envoyés (pas écraser avec null)
        $data = array_filter([
            'name'            => $request->name,
            'email'           => $request->email,
            'profile_picture' => $request->profile_picture,
            'status'          => $request->status,
            'role'            => $request->role,
        ], fn($v) => $v !== null);

        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->password);
        }

        $user->update($data);
        return response()->json(['message' => 'User modifié avec succès', 'user' => $user]);
    }

    public function getUserById($id){
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function filtreFormateursByStatus(request $request){
        $formateurs = User::where('role', 'formateur')->where('status', $request->status)->get();
        return response()->json($formateurs);
    }

    public function filtreCandidatsByStatus(request $request){
        $candidats = User::where('role', 'candidat')->where('status', $request->status)->get();
        return response()->json($candidats);
    }


    public function getAllUsers(){
        $users = User::all();
        return response()->json($users);
    }

    public function getFormateursPublics() {
        $formateurs = User::where('role', 'formateur')
            ->where('status', 'actif')
            ->select('id', 'name', 'prenom', 'bio', 'domaine', 'specialite', 'profile_picture', 'annees_experience', 'ville')
            ->get();
        return response()->json($formateurs);
    }

    public function getFormateursByDomaine($domaine) {
        $formateurs = User::where('role', 'formateur')
            ->where('status', 'actif')
            ->where('domaine', $domaine)
            ->select('id', 'name', 'prenom', 'bio', 'domaine', 'specialite', 'profile_picture', 'annees_experience', 'ville')
            ->get();
        return response()->json($formateurs);
    }

    public function updateUserStatus(Request $request, $id){
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }
        $user->update([
            'status' => $request->status,
            'updated_at' => now()
        ]);
        return response()->json([
            'message' => 'Statut de l\'utilisateur mis à jour avec succès',
            'user' => $user
        ]);
    }
}
