<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ajouter les champs "profil complet" dans inscription__candidats
        Schema::table('inscription__candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('inscription__candidats', 'score_technique')) {
                $table->integer('score_technique')->default(0)->after('format');
            }
            if (!Schema::hasColumn('inscription__candidats', 'score_soft_skills')) {
                $table->integer('score_soft_skills')->default(0)->after('score_technique');
            }
            if (!Schema::hasColumn('inscription__candidats', 'nb_formations_anterieures')) {
                $table->integer('nb_formations_anterieures')->default(0)->after('score_soft_skills');
            }
            if (!Schema::hasColumn('inscription__candidats', 'experience')) {
                $table->integer('experience')->default(0)->after('nb_formations_anterieures');
            }
            if (!Schema::hasColumn('inscription__candidats', 'preference_format')) {
                $table->string('preference_format')->nullable()->after('experience');
            }
            if (!Schema::hasColumn('inscription__candidats', 'preference_horaire')) {
                $table->string('preference_horaire')->nullable()->after('preference_format');
            }
            if (!Schema::hasColumn('inscription__candidats', 'categorie_client')) {
                $table->string('categorie_client')->nullable()->after('preference_horaire');
            }
        });

        // 2. Simplifier inscription_profilages : ne garder que les 4 champs IA + groupe_estime
        // On supprime les colonnes qui ne doivent plus être là
        Schema::table('inscription_profilages', function (Blueprint $table) {
            $columnsToDrop = [
                'score_technique', 'score_soft_skills', 'nb_formations_anterieures',
                'experience', 'preference_format', 'preference_horaire', 'categorie_client'
            ];
            foreach ($columnsToDrop as $col) {
                if (Schema::hasColumn('inscription_profilages', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    public function down(): void
    {
        // Annuler les changements sur inscription__candidats
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $cols = ['score_technique', 'score_soft_skills', 'nb_formations_anterieures', 'experience', 'preference_format', 'preference_horaire', 'categorie_client'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('inscription__candidats', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // Remettre les colonnes dans inscription_profilages
        Schema::table('inscription_profilages', function (Blueprint $table) {
            $table->integer('score_technique')->default(0);
            $table->integer('score_soft_skills')->default(0);
            $table->integer('nb_formations_anterieures')->default(0);
            $table->integer('experience')->default(0);
            $table->string('preference_format')->nullable();
            $table->string('preference_horaire')->nullable();
            $table->string('categorie_client')->nullable();
        });
    }
};
