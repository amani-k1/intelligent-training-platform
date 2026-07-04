<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Destinataire (microservice)
            $table->string('title');
            $table->text('message');
            $table->enum('type', ['success', 'info', 'warning', 'error'])->default('info');
            $table->enum('role', ['admin', 'formateur', 'stagiaire'])->default('stagiaire');
            $table->boolean('is_read')->default(false);
            $table->boolean('archived')->default(false);
            $table->string('link')->nullable(); // Lien optionnel
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            // Index pour les performances
            $table->index('user_id');
            $table->index('role');
            $table->index('is_read');
            $table->index('archived');
            $table->index('type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
};