<?php

namespace App\Console\Commands;

use App\Services\Notifications\TaskNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendTaskReminders extends Command
{
    protected $signature = 'tasks:send-reminders';

    protected $description = 'Send WhatsApp reminders for due/overdue staff tasks';

    public function handle(TaskNotificationService $notifications): int
    {
        $result = $notifications->sendDueReminders();

        if (($result['reason'] ?? null) === 'not_configured') {
            $this->warn('WasenderAPI not configured — skipping task reminders.');

            return self::SUCCESS;
        }

        $this->info("Task reminders sent: {$result['sent']}, skipped: {$result['skipped']}");
        Log::info('Task reminders processed', $result);

        return self::SUCCESS;
    }
}
