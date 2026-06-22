<?php

namespace App\Notifications;

use App\Models\ServiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewServiceRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ServiceRequest $serviceRequest,
        public string $trackingUrl,
        public string $reviewUrl,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_service_request',
            'reference_number' => $this->serviceRequest->reference_number,
            'client_name' => $this->serviceRequest->client_name,
            'client_phone' => $this->serviceRequest->client_phone,
            'event_title' => $this->serviceRequest->event_title,
            'event_date' => $this->serviceRequest->event_date->format('Y-m-d'),
            'services' => $this->serviceRequest->items->pluck('service_name')->toArray(),
            'tracking_url' => $this->trackingUrl,
            'review_url' => $this->reviewUrl,
            'service_request_id' => $this->serviceRequest->id,
        ];
    }
}
