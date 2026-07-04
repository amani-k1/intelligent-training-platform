<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:200',
            'message' => 'required|string|max:5000',
        ]);

        // Récupérer les infos de l'utilisateur depuis le JWT (injecté par le middleware)
        $userName  = $request->user_name  ?? $request->header('X-User-Name')  ?? 'Utilisateur';
        $userEmail = $request->user_email ?? $request->header('X-User-Email') ?? '';

        // Fallback: lire depuis les données envoyées par le frontend
        if (!$userEmail && $request->filled('user_email')) {
            $userEmail = $request->input('user_email');
        }
        if (!$userName && $request->filled('user_name')) {
            $userName = $request->input('user_name');
        }

        // Sauvegarder en base
        ContactMessage::create([
            'user_name'  => $userName,
            'user_email' => $userEmail,
            'subject'    => $validated['subject'],
            'message'    => $validated['message'],
        ]);

        // Envoyer l'email au directeur
        $directorEmail = env('DIRECTOR_EMAIL', 'Ismail.sahli@brn-smart.tn');

        Mail::to($directorEmail)->send(new ContactMessageMail(
            userName:    $userName,
            userEmail:   $userEmail,
            subject:     $validated['subject'],
            messageBody: $validated['message'],
        ));

        return response()->json(['message' => 'Votre message a été envoyé avec succès.'], 200);
    }
}
