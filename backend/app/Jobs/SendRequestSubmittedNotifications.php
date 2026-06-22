<?php

namespace App\Jobs;

use App\Models\ServiceRequest;
use App\Services\Notifications\RequestNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendRequestSubmittedNotifications implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public int $serviceRequestId) {}

    public function handle(RequestNotificationService $notifications): void
    {
        $request = ServiceRequest::with(['items', 'documents'])->find($this->serviceRequestId);

        if (! $request) {
            return;
        }

        try {
            $notifications->sendSubmitted($request);
        } catch (\Throwable $e) {
            Log::error('Request notification job failed', [
                'request_id' => $this->serviceRequestId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
