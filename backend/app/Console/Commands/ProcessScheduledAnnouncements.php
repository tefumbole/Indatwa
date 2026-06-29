<?php

namespace App\Console\Commands;

use App\Services\Announcements\AnnouncementService;
use Illuminate\Console\Command;

class ProcessScheduledAnnouncements extends Command
{
    protected $signature = 'announcements:process-scheduled';

    protected $description = 'Send due scheduled WhatsApp announcements';

    public function handle(AnnouncementService $service): int
    {
        $count = $service->processScheduled();
        $this->info("Processed {$count} scheduled announcement(s).");

        return self::SUCCESS;
    }
}
