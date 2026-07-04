<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->integer('xp');
            $table->text('condition');
            $table->string('color');
            $table->timestamps();
        });

        // Table pour suivre les attributions SANS contrainte étrangère
        Schema::create('badge_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('badge_id');
            $table->unsignedBigInteger('user_id'); // ID de l'utilisateur du service-1
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();
            
            // Index pour les performances
            $table->index('badge_id');
            $table->index('user_id');
            $table->unique(['badge_id', 'user_id']); // Un utilisateur ne peut avoir le même badge qu'une fois
            
            // On garde uniquement la contrainte étrangère pour badge_id
            $table->foreign('badge_id')
                  ->references('id')
                  ->on('badges')
                  ->onDelete('cascade');
            
            // PAS de contrainte étrangère pour user_id car la table users est dans le service-1
        });
    }

    public function down()
    {
        Schema::dropIfExists('badge_assignments');
        Schema::dropIfExists('badges');
    }
};