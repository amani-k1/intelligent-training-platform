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
        Schema::create('formation_realises', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->integer('nbr_participants');
            $table->string('formateur');
            $table->string('formation');
            $table->date('date_realisation');
            $table->softDeletes();
            

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formation_realises');
    }
};
