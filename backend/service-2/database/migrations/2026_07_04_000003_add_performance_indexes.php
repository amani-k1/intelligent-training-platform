<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // inscription__candidats — colonnes filtrées fréquemment
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->index('formation_id',  'idx_inscriptions_formation_id');
            $table->index('statut',        'idx_inscriptions_statut');
            $table->index('email',         'idx_inscriptions_email');
        });

        // formations — colonnes filtrées / triées fréquemment
        Schema::table('formations', function (Blueprint $table) {
            $table->index('statut',        'idx_formations_statut');
            $table->index('domaine',       'idx_formations_domaine');
            $table->index('id_formateur',  'idx_formations_formateur');
        });
    }

    public function down(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->dropIndex('idx_inscriptions_formation_id');
            $table->dropIndex('idx_inscriptions_statut');
            $table->dropIndex('idx_inscriptions_email');
        });

        Schema::table('formations', function (Blueprint $table) {
            $table->dropIndex('idx_formations_statut');
            $table->dropIndex('idx_formations_domaine');
            $table->dropIndex('idx_formations_formateur');
        });
    }
};
