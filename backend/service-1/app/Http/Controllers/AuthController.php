<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use App\Models\User;

class AuthController extends Controller
{
    
    //
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ], [
            'email.unique'   => 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser une autre adresse.',
            'email.required' => 'L\'adresse email est obligatoire.',
            'email.email'    => 'Veuillez entrer une adresse email valide.',
            'name.required'  => 'Le nom complet est obligatoire.',
            'password.min'   => 'Le mot de passe doit contenir au moins 6 caractères.',
        ]);

        $user = User::create([
            'name'            => $request->name,
            'email'           => $request->email,
            'password'        => bcrypt($request->password),
            'profile_picture' => $request->profile_picture,
            'status'          => 'actif',
            'role'            => 'stagiaire',
        ]);

        return response()->json($user, 201);
    }
    

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'token' => $token,
            'user' => auth()->user()
        ]);
    }

    

    
    


    public function logout()
    {
        auth()->logout();
        return response()->json(['message' => 'Logged out']);
    }

    


}
