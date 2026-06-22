<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAuthPortalTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('service_request_messages')) {
            Schema::create('service_request_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('service_request_id')->constrained()->onDelete('cascade');
                $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
                $table->text('message');
                $table->boolean('is_internal')->default(false);
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('service_request_messages');
    }
}
