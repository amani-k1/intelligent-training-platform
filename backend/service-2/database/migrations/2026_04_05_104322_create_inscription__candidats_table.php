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
        Schema::create('inscription__candidats', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->string('nom', 255);
            $table->string('prenom', 255);
            $table->string('email', 255)->unique();
            $table->string('adresse', 255);
            $table->string('état_civil',50);
            $table->string('telephone', 20);
            $table->string('cv');
            $table->string('situation');
            $table->string('format');
            $table->enum('statut', ['en_attente', 'accepte', 'refuse'])->default('en_attente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inscription__candidats');
    }
};
