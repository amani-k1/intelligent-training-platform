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
        Schema::create('formations', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('title');
            $table->text('description');
            $table->string('nom_formateur');
            $table->unsignedBigInteger('id_formateur');
            $table->integer('duree');
            $table->string('domaine');
            $table->enum('niveau', ['Débutant', 'Intermédiaire', 'Avancé']);
            $table->decimal('prix', 8, 2);
            $table->integer('places_totales');
            $table->enum('statut', ['Brouillon', 'En cours', 'Complet', 'Fermée'])->default('Brouillon');
            

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formations');
    }
};
