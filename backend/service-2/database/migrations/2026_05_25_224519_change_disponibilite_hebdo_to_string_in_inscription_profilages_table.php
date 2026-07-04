<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // On utilise DB::statement car Doctrine/DBAL ne gère pas toujours bien le cast avec enum/string
        // ou bien on installe doctrine/dbal et on fait $table->string(...)->change();
        DB::statement('ALTER TABLE inscription_profilages ALTER COLUMN disponibilite_hebdo TYPE VARCHAR(255) USING disponibilite_hebdo::VARCHAR');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE inscription_profilages ALTER COLUMN disponibilite_hebdo TYPE INTEGER USING disponibilite_hebdo::INTEGER');
    }
};

