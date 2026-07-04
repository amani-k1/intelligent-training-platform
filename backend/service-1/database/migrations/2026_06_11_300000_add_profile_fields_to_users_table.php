<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('prenom')->nullable()->after('name');
            $table->string('phone', 20)->nullable()->after('email');
            $table->text('bio')->nullable()->after('role');
            $table->string('domaine')->nullable()->after('bio');
            $table->string('specialite')->nullable()->after('domaine');
            $table->string('ville')->nullable()->after('specialite');
            $table->string('adresse')->nullable()->after('ville');
            $table->date('date_naissance')->nullable()->after('adresse');
            $table->string('genre', 20)->nullable()->after('date_naissance');
            $table->string('linkedin')->nullable()->after('genre');
            $table->unsignedSmallInteger('annees_experience')->nullable()->after('linkedin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'prenom', 'phone', 'bio', 'domaine', 'specialite',
                'ville', 'adresse', 'date_naissance', 'genre',
                'linkedin', 'annees_experience',
            ]);
        });
    }
};
