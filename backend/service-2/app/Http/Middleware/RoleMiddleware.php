<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Le rôle est déjà injecté par JwtMiddleware dans $request->attributes.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Le JwtMiddleware a déjà validé le token et injecté le rôle
        $userRole = $request->attributes->get('role');

        if (!$userRole) {
            return response()->json(['error' => 'Rôle introuvable — JWT non validé en amont'], 401);
        }

        if (!in_array($userRole, $roles)) {
            return response()->json([
                'error'         => 'Accès interdit',
                'votre_role'    => $userRole,
                'roles_requis'  => $roles,
            ], 403);
        }

        return $next($request);
    }
}
