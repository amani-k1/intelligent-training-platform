<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = \DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'inscription__candidats' AND indexname = 'inscription__candidats_email_unique'");
        if (!empty($indexes)) {
            Schema::table('inscription__candidats', function (Blueprint $table) {
                $table->dropUnique(['email']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('inscription__candidats', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
