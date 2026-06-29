<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_tasks', function (Blueprint $table) {
            $table->timestamp('assignment_notified_at')->nullable()->after('completed_at');
            $table->timestamp('last_reminder_at')->nullable()->after('assignment_notified_at');
            $table->string('last_reminder_type', 50)->nullable()->after('last_reminder_at');
        });
    }

    public function down(): void
    {
        Schema::table('staff_tasks', function (Blueprint $table) {
            $table->dropColumn(['assignment_notified_at', 'last_reminder_at', 'last_reminder_type']);
        });
    }
};
