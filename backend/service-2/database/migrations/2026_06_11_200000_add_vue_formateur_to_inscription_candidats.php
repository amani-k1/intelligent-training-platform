<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->boolean('vue_formateur')->default(false)->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->dropColumn('vue_formateur');
        });
    }
};
