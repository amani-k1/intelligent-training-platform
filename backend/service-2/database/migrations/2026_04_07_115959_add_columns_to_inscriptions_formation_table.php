<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inscriptions_formation', function (Blueprint $table) {
            $table->string('niveau')->nullable();
            $table->string('rythme')->nullable();
            $table->string('objectif')->nullable();
            $table->string('disponibilite')->nullable();
            $table->string('groupe_estime')->nullable();
        });
    }

    public function down()
    {
        Schema::table('inscriptions_formation', function (Blueprint $table) {
            $table->dropColumn(['niveau', 'rythme', 'objectif', 'disponibilite', 'groupe_estime']);
        });
    }
};
