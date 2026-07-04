<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$alertes = \App\Models\Alerte::all();
echo "Total alertes: " . $alertes->count() . "\n";
foreach($alertes as $a) {
    echo $a->recherche . " -> " . $a->formation_proche . "\n";
}
