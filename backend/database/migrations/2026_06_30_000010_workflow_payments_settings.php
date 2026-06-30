<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->decimal('miscellaneous_amount', 12, 2)->nullable()->after('quoted_amount');
            $table->boolean('agreement_accepted')->default(false)->after('client_signed_at');
            $table->timestamp('agreement_accepted_at')->nullable()->after('agreement_accepted');
            $table->string('quotation_access_token', 64)->nullable()->unique()->after('tracking_token');
            $table->timestamp('profile_completed_at')->nullable()->after('user_id');
        });

        Schema::table('service_request_items', function (Blueprint $table) {
            $table->string('client_status', 20)->default('pending')->after('status');
            $table->timestamp('client_responded_at')->nullable()->after('client_status');
        });

        Schema::table('staff_tasks', function (Blueprint $table) {
            $table->json('assigned_service_item_ids')->nullable()->after('service_request_id');
            $table->boolean('hide_amounts')->default(true)->after('assigned_service_item_ids');
        });

        if (! Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
                $table->string('invoice_number')->unique();
                $table->decimal('total_amount', 12, 2);
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->string('currency', 10)->default('RWF');
                $table->string('status', 20)->default('sent');
                $table->date('due_date')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('invoice_payments')) {
            Schema::create('invoice_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
                $table->decimal('amount', 12, 2);
                $table->string('payment_method', 50)->nullable();
                $table->string('reference')->nullable();
                $table->string('status', 20)->default('confirmed');
                $table->text('notes')->nullable();
                $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn([
                'miscellaneous_amount', 'agreement_accepted', 'agreement_accepted_at',
                'quotation_access_token', 'profile_completed_at',
            ]);
        });

        Schema::table('service_request_items', function (Blueprint $table) {
            $table->dropColumn(['client_status', 'client_responded_at']);
        });

        Schema::table('staff_tasks', function (Blueprint $table) {
            $table->dropColumn(['assigned_service_item_ids', 'hide_amounts']);
        });
    }
};
