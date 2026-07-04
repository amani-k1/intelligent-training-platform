<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('alertes', function (Blueprint $table) {
            $table->json('formations_proches')->nullable()->after('similarite');
        });
    }

    public function down()
    {
        Schema::table('alertes', function (Blueprint $table) {
            $table->dropColumn('formations_proches');
        });
    }
};
