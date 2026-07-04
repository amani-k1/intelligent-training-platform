<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use PDF;

class NotificationController extends Controller
{
    // Récupérer les notifications actives
    public function index(Request $request)
    {
        $userId = $request->user_id ?? auth()->id();
        
        $notifications = Notification::where('user_id', $userId)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $notifications->where('is_read', false)->count()
        ]);
    }

    // Récupérer les notifications archivées
    public function archived(Request $request)
    {
        $userId = $request->user_id ?? auth()->id();
        
        $notifications = Notification::where('user_id', $userId)
            ->archived()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    // Récupérer une notification spécifique
    public function show($id)
    {
        $notification = Notification::findOrFail($id);
        
        // Marquer comme lue automatiquement
        if (!$notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now()
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $notification
        ]);
    }

    // Créer une notification
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:success,info,warning,error',
            'role' => 'required|in:admin,formateur,stagiaire',
            'link' => 'nullable|url'
        ]);

        $notification = Notification::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Notification créée avec succès',
            'data' => $notification
        ], 201);
    }

    // Marquer comme lue
    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update([
            'is_read' => true,
            'read_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
            'data' => $notification
        ]);
    }

    // Marquer toutes comme lues
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user_id ?? auth()->id();
        
        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues'
        ]);
    }

    // Archiver
    public function archive($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['archived' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification archivée',
            'data' => $notification
        ]);
    }

    // Restaurer
    public function restore($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['archived' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Notification restaurée',
            'data' => $notification
        ]);
    }

    // Supprimer
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée définitivement'
        ]);
    }

    // Générer PDF
    public function generatePDF($id)
    {
        $notification = Notification::findOrFail($id);
        
        $pdf = PDF::loadView('pdfs.notification', compact('notification'));
        
        return $pdf->download("notification-{$id}-rapport.pdf");
    }

    // Par rôle
    public function byRole($role)
    {
        $notifications = Notification::byRole($role)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    // Par type
    public function byType($type)
    {
        $notifications = Notification::byType($type)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }
}