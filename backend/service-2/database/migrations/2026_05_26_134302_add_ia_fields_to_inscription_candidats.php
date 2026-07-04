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
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->string('niveau')->nullable()->after('format');
            $table->string('rythme')->nullable()->after('niveau');
            $table->string('objectif')->nullable()->after('rythme');
            $table->string('disponibilite_hebdo')->nullable()->after('objectif');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->dropColumn(['niveau', 'rythme', 'objectif', 'disponibilite_hebdo']);
        });
    }
};
