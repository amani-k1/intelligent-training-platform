<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    // GET /profile — retourne le profil complet de l'utilisateur connecté
    public function consulterProfil()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $data = $user->toArray();

        // Construire l'URL de l'avatar si c'est un fichier local
        if ($user->profile_picture && !str_starts_with($user->profile_picture, 'http')) {
            $data['avatar_url'] = url('storage/avatars/' . $user->profile_picture);
        } else {
            $data['avatar_url'] = $user->profile_picture;
        }

        return response()->json($data);
    }

    // PUT /update-profile — mise à jour des informations personnelles et professionnelles
    public function updateProfil(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $validated = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'prenom'            => 'sometimes|nullable|string|max:255',
            'email'             => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone'             => 'sometimes|nullable|string|max:20',
            'bio'               => 'sometimes|nullable|string|max:1000',
            'domaine'           => 'sometimes|nullable|string|max:255',
            'specialite'        => 'sometimes|nullable|string|max:255',
            'ville'             => 'sometimes|nullable|string|max:255',
            'adresse'           => 'sometimes|nullable|string|max:255',
            'date_naissance'    => 'sometimes|nullable|date|before:today',
            'genre'             => 'sometimes|nullable|in:M,F,Autre',
            'linkedin'          => 'sometimes|nullable|string|max:255',
            'annees_experience' => 'sometimes|nullable|integer|min:0|max:60',
        ]);

        $user->update($validated);

        $data = $user->fresh()->toArray();
        if ($user->profile_picture && !str_starts_with($user->profile_picture, 'http')) {
            $data['avatar_url'] = url('storage/avatars/' . $user->profile_picture);
        } else {
            $data['avatar_url'] = $user->profile_picture;
        }

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user'    => $data,
        ]);
    }

    // POST /update-password — changement sécurisé du mot de passe
    public function updatePassword(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $request->validate([
            'current_password'          => 'required|string',
            'new_password'              => ['required', 'string', 'confirmed', Password::min(8)
                ->mixedCase()
                ->numbers()],
            'new_password_confirmation' => 'required|string',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors'  => ['current_password' => ['Mot de passe actuel incorrect']],
            ], 422);
        }

        $user->password = bcrypt($request->new_password);
        $user->save();

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    // POST /update-avatar — upload de la photo de profil
    public function updateAvatar(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $request->validate([
            'avatar' => 'required|image|max:2048|mimes:jpg,jpeg,png,webp',
        ]);

        // Supprimer l'ancien avatar local si présent
        if ($user->profile_picture && !str_starts_with($user->profile_picture, 'http')) {
            Storage::delete('public/avatars/' . $user->profile_picture);
        }

        $ext      = $request->file('avatar')->extension();
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $ext;
        $request->file('avatar')->storeAs('public/avatars', $filename);

        $user->profile_picture = $filename;
        $user->save();

        return response()->json([
            'message'    => 'Photo de profil mise à jour.',
            'avatar_url' => url('storage/avatars/' . $filename),
        ]);
    }
}
