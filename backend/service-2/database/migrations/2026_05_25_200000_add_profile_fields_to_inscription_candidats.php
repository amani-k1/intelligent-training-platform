<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('inscription__candidats', 'score_technique')) {
                $table->integer('score_technique')->nullable();
            }
            if (!Schema::hasColumn('inscription__candidats', 'score_soft_skills')) {
                $table->integer('score_soft_skills')->nullable();
            }
            if (!Schema::hasColumn('inscription__candidats', 'nb_formations_anterieures')) {
                $table->integer('nb_formations_anterieures')->nullable();
            }
            if (!Schema::hasColumn('inscription__candidats', 'experience')) {
                $table->text('experience')->nullable();
            }
            if (!Schema::hasColumn('inscription__candidats', 'preference_format')) {
                $table->string('preference_format')->nullable();
            }
            if (!Schema::hasColumn('inscription__candidats', 'preference_horaire')) {
                $table->string('preference_horaire')->nullable();
            }
            if (!Schema::hasColumn('inscription__candidats', 'categorie_client')) {
                $table->string('categorie_client')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->dropColumn([
                'score_technique',
                'score_soft_skills',
                'nb_formations_anterieures',
                'experience',
                'preference_format',
                'preference_horaire',
                'categorie_client',
            ]);
        });
    }
};
