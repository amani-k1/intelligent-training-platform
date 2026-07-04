<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS Configuration (Disabled)
    |--------------------------------------------------------------------------
    | This file intentionally disables Laravel's automatic CORS handling by
    | setting no matched paths. The API gateway (nginx) will provide CORS.
    |
    */

    'paths' => [
        // empty => Laravel will not add CORS headers
    ],

    'allowed_methods' => ['*'],
    'allowed_origins' => [],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,

];
