<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inscription_profilages', function (Blueprint $table) {
            // Ensure the essential IA fields exist
            if (!Schema::hasColumn('inscription_profilages', 'inscription_candidat_id')) {
                $table->unsignedBigInteger('inscription_candidat_id')->nullable()->index();
            }
            if (!Schema::hasColumn('inscription_profilages', 'niveau')) {
                $table->string('niveau')->nullable();
            }
            if (!Schema::hasColumn('inscription_profilages', 'rythme')) {
                $table->string('rythme')->nullable();
            }
            if (!Schema::hasColumn('inscription_profilages', 'objectif')) {
                $table->string('objectif')->nullable();
            }
            if (!Schema::hasColumn('inscription_profilages', 'disponibilite_hebdo')) {
                $table->string('disponibilite_hebdo')->nullable();
            }
            if (!Schema::hasColumn('inscription_profilages', 'groupe_estime')) {
                $table->string('groupe_estime')->nullable();
            }
        });

        // Note: We do not drop other columns here automatically to avoid destructive changes.
        // Manual cleanup can be done later if desired.
    }

    public function down(): void
    {
        Schema::table('inscription_profilages', function (Blueprint $table) {
            // do not drop to avoid data loss
        });
    }
};
