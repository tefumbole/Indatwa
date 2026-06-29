<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_request_items', function (Blueprint $table) {
            $table->decimal('quoted_price', 12, 2)->nullable()->after('admin_comment');
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->timestamp('sent_for_signature_at')->nullable()->after('quotation_sent_at');
            $table->timestamp('client_signed_at')->nullable()->after('sent_for_signature_at');
        });

        Schema::create('calendar_dates', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->boolean('is_booked')->default(true);
            $table->foreignId('service_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('label')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('service_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->json('assigned_user_ids')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_assignments');
        Schema::dropIfExists('calendar_dates');

        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn(['sent_for_signature_at', 'client_signed_at']);
        });

        Schema::table('service_request_items', function (Blueprint $table) {
            $table->dropColumn('quoted_price');
        });
    }
};
