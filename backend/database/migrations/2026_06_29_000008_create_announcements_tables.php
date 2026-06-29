<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcement_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('Indatwa Protocol & Services Agency');
            $table->string('default_header')->nullable();
            $table->string('serial_prefix', 20)->default('IPS/ANN');
            $table->unsignedInteger('next_serial')->default(1);
            $table->unsignedTinyInteger('serial_padding')->default(6);
            $table->string('timezone', 50)->default('Africa/Kigali');
            $table->timestamps();
        });

        Schema::create('announcement_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('subject')->nullable();
            $table->text('header')->nullable();
            $table->text('body');
            $table->text('footer')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('title');
            $table->string('category')->nullable();
            $table->text('header')->nullable();
            $table->text('body');
            $table->text('footer')->nullable();
            $table->enum('audience_type', ['clients', 'staff', 'custom'])->default('custom');
            $table->json('recipients')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'sent', 'partial', 'failed'])->default('draft');
            $table->enum('whatsapp_status', ['draft', 'scheduled', 'pending', 'sent', 'partial', 'failed'])->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->json('attachments')->nullable();
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->json('send_results')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('announcement_templates');
        Schema::dropIfExists('announcement_settings');
    }
};
