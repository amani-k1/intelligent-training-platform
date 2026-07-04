<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /notifications — notifications de l'utilisateur connecté (par user_id JWT)
    public function index(Request $request)
    {
        $user_id = $request->attributes->get('user_id');

        $notifications = Notification::where('user_id', $user_id)
            ->where('archived', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    // GET /notifications/archived
    public function archived(Request $request)
    {
        $user_id = $request->attributes->get('user_id');

        $notifications = Notification::where('user_id', $user_id)
            ->where('archived', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    // GET /notifications/role/{role}
    // Formateur → filtre par user_id + role
    // Admin → filtre par role uniquement (toutes les notifs admin)
    public function byRole(Request $request, $role)
    {
        $user_id = $request->attributes->get('user_id');

        $query = Notification::where('role', $role)->where('archived', false);

        if ($role !== 'admin') {
            $query->where('user_id', $user_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    // GET /notifications/type/{type}
    public function byType(Request $request, $type)
    {
        $user_id = $request->attributes->get('user_id');

        $notifications = Notification::where('user_id', $user_id)
            ->where('type', $type)
            ->where('archived', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    // GET /notifications/{id}
    public function show($id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['error' => 'Notification non trouvée'], 404);
        }
        return response()->json($notification);
    }

    // POST /notifications
    public function store(Request $request)
    {
        $notification = Notification::create([
            'user_id'  => $request->user_id ?? 0,
            'title'    => $request->title,
            'message'  => $request->message,
            'type'     => $request->type     ?? 'info',
            'role'     => $request->role     ?? 'stagiaire',
            'is_read'  => false,
            'archived' => false,
            'link'     => $request->link     ?? null,
        ]);

        return response()->json($notification, 201);
    }

    // PUT /notifications/read-all
    public function markAllAsRead(Request $request)
    {
        $user_id = $request->attributes->get('user_id');

        Notification::where('user_id', $user_id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    // PUT /notifications/{id}/read
    public function markAsRead($id)
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->is_read = true;
            $notification->read_at = now();
            $notification->save();
        }
        return response()->json(['id' => $id, 'read' => true]);
    }

    // PUT /notifications/{id}/archive
    public function archive($id)
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->archived = true;
            $notification->save();
        }
        return response()->json(['id' => $id, 'archived' => true]);
    }

    // PUT /notifications/{id}/restore
    public function restore($id)
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->archived = false;
            $notification->save();
        }
        return response()->json(['id' => $id, 'restored' => true]);
    }

    // DELETE /notifications/{id}
    public function destroy($id)
    {
        Notification::destroy($id);
        return response()->json(['id' => $id, 'deleted' => true]);
    }

    public function generatePDF($id)
    {
        return response()->json(['id' => $id, 'pdf' => null]);
    }
}
