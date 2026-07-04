<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('badge_assignments', function (Blueprint $table) {
            $table->string('user_name')->nullable()->after('user_id');
            $table->string('user_role')->nullable()->after('user_name'); // formateur, stagiaire, client_b2b, client_b2c
            $table->text('note')->nullable()->after('user_role');
        });
    }

    public function down()
    {
        Schema::table('badge_assignments', function (Blueprint $table) {
            $table->dropColumn(['user_name', 'user_role', 'note']);
        });
    }
};
