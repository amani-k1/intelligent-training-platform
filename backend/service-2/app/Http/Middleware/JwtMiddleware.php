<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\LooseValidAt;
use Lcobucci\JWT\Validation\RequiredConstraintsViolated;
use Lcobucci\Clock\SystemClock;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Token absent ou malformé'], 401);
        }

        $rawToken = substr($authHeader, 7);

        try {
            $secret = env('JWT_SECRET');

            $config = Configuration::forSymmetricSigner(
                new Sha256(),
                InMemory::plainText($secret)
            );

            $config->setValidationConstraints(
                new SignedWith($config->signer(), $config->verificationKey()),
                new LooseValidAt(SystemClock::fromUTC())
            );

            $token = $config->parser()->parse($rawToken);

            // Vérification de la signature
            $constraints = $config->validationConstraints();
            $config->validator()->assert($token, ...$constraints);

            // Extraire les claims
            $claims = $token->claims();

            $request->attributes->add([
                'user_id' => $claims->get('sub'),
                'email'   => $claims->get('email'),
                'role'    => $claims->get('role'),
            ]);

        } catch (RequiredConstraintsViolated $e) {
            $msg = str_contains($e->getMessage(), 'expired') ? 'Token expiré' : 'Token JWT invalide';
            return response()->json(['error' => $msg], 401);
        } catch (Exception $e) {
            return response()->json(['error' => 'Token invalide'], 401);
        }

        return $next($request);
    }
}
