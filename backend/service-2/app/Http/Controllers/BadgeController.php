<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\BadgeAssignment;
use Illuminate\Http\Request;

class BadgeController extends Controller
{
    public function index()
    {
        try {
            $badges = Badge::withCount('assignments')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $badges
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'xp' => 'required|integer|min:0',
                'condition' => 'required|string',
                'color' => 'required|string',
            ]);

            $badge = Badge::create($validated);

            return response()->json([
                'success' => true,
                'data' => $badge
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $badge = Badge::withCount('assignments')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $badge
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Badge non trouvé'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $badge = Badge::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'xp' => 'sometimes|integer|min:0',
                'condition' => 'sometimes|string',
                'color' => 'sometimes|string',
            ]);

            $badge->update($validated);

            return response()->json([
                'success' => true,
                'data' => $badge
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $badge = Badge::findOrFail($id);
            $badge->delete();

            return response()->json([
                'success' => true,
                'message' => 'Badge supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function learners($badgeId)
    {
        try {
            $badge = Badge::findOrFail($badgeId);
            $assignments = $badge->assignments()
                ->orderBy('assigned_at', 'desc')
                ->get();

            $learners = $assignments->map(function ($assignment) {
                return [
                    'id'        => $assignment->id,
                    'user_id'   => $assignment->user_id,
                    'name'      => $assignment->user_name ?? ('Utilisateur ' . $assignment->user_id),
                    'role'      => $assignment->user_role ?? '—',
                    'note'      => $assignment->note,
                    'date'      => $assignment->assigned_at
                                    ? $assignment->assigned_at->format('d/m/Y')
                                    : now()->format('d/m/Y'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $learners
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function assign(Request $request, $badgeId)
    {
        try {
            $badge = Badge::findOrFail($badgeId);

            $validated = $request->validate([
                'user_id'   => 'required|integer',
                'user_name' => 'required|string|max:255',
                'user_role' => 'required|in:formateur,stagiaire,client_b2b,client_b2c',
                'note'      => 'nullable|string|max:500',
            ]);

            // Vérifier si déjà attribué
            $exists = BadgeAssignment::where('badge_id', $badgeId)
                ->where('user_id', $validated['user_id'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce badge a déjà été attribué à cet utilisateur.'
                ], 409);
            }

            $assignment = BadgeAssignment::create([
                'badge_id'    => $badge->id,
                'user_id'     => $validated['user_id'],
                'user_name'   => $validated['user_name'],
                'user_role'   => $validated['user_role'],
                'note'        => $validated['note'] ?? null,
                'assigned_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Badge attribué avec succès à ' . $validated['user_name'],
                'data'    => $assignment
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function revoke($badgeId, $assignmentId)
    {
        try {
            $assignment = BadgeAssignment::where('badge_id', $badgeId)
                ->where('id', $assignmentId)
                ->firstOrFail();

            $name = $assignment->user_name;
            $assignment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Attribution révoquée pour ' . $name
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}