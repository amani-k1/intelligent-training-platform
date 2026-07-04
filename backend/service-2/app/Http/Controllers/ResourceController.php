<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Resource;

class ResourceController extends Controller
{
    // GET /resources/formation/{formation_id}
    public function getByFormation($formation_id)
    {
        $resources = Resource::where('formation_id', $formation_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'title'        => $r->title,
                'type'         => $r->type,
                'formation_id' => $r->formation_id,
                'created_at'   => $r->created_at,
                'download_url' => url("/api/resources/download/{$r->id}"),
            ]);

        return response()->json($resources);
    }

    // POST /resources  (multipart: file, title, formation_id)
    public function uploadResource(Request $request)
    {
        $request->validate([
            'file'         => 'required|file|max:20480',
            'title'        => 'required|string|max:255',
            'formation_id' => 'required|integer',
        ]);

        $file = $request->file('file');
        $path = $file->store('resources', 'public');

        $resource = Resource::create([
            'title'        => $request->title,
            'file_path'    => $path,
            'type'         => $file->getClientOriginalExtension(),
            'user_id'      => $request->user_id ?? 0,
            'formation_id' => $request->formation_id,
        ]);

        return response()->json([
            'id'           => $resource->id,
            'title'        => $resource->title,
            'type'         => $resource->type,
            'formation_id' => $resource->formation_id,
            'created_at'   => $resource->created_at,
            'download_url' => url("/api/resources/download/{$resource->id}"),
        ], 201);
    }

    // GET /resources/download/{id}
    public function download($id)
    {
        $resource = Resource::findOrFail($id);
        return response()->download(storage_path('app/public/' . $resource->file_path), $resource->title . '.' . $resource->type);
    }

    // DELETE /resources/delete/{id}
    public function dropResource($id)
    {
        $resource = Resource::findOrFail($id);
        Storage::disk('public')->delete($resource->file_path);
        $resource->delete();
        return response()->json(['message' => 'Fichier supprimé']);
    }

    // GET /resources  (all — kept for admin)
    public function getResource()
    {
        return Resource::all();
    }
}
