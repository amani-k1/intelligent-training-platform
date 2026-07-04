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
        Schema::create('financier_candidats', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->unsignedBigInteger('user_id');
            $table->string('nom');
            $table->string('prenom');
            $table->string('etat_payment')->default('en attente'); 
            $table->string('mode_payment');
            $table->integer('montant');
            $table->integer('avance')->default(0);
            $table->integer('rest_a_payer');
            $table->foreignId('formation_realise_id')->constrained()->onDelete('cascade');
            


        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financier_candidats');
    }
};
