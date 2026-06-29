<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->unique()->nullable()->after('email');
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->time('event_start_time')->nullable()->after('event_end_date');
            $table->time('event_end_time')->nullable()->after('event_start_time');
            $table->decimal('quoted_amount', 12, 2)->nullable()->after('client_notes');
            $table->text('quotation_notes')->nullable()->after('quoted_amount');
            $table->timestamp('quotation_sent_at')->nullable()->after('quotation_notes');
        });

        Schema::create('service_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('client_name');
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->unique('service_request_id');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number', 30)->unique();
            $table->decimal('total_amount', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->char('currency', 3)->default('RWF');
            $table->enum('status', ['draft', 'sent', 'partial', 'paid', 'cancelled'])->default('draft');
            $table->date('due_date')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 50)->nullable();
            $table->string('reference', 100)->nullable();
            $table->enum('status', ['pending', 'confirmed', 'failed'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoice_payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('service_reviews');

        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn([
                'event_start_time', 'event_end_time',
                'quoted_amount', 'quotation_notes', 'quotation_sent_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
        });
    }
};
