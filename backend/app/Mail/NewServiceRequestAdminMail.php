<?php

namespace App\Mail;

use App\Models\ServiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class NewServiceRequestAdminMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public ServiceRequest $serviceRequest,
        public string $trackingUrl,
        public string $reviewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Service Request — '.$this->serviceRequest->reference_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-new-request',
        );
    }

    public function attachments(): array
    {
        if (! $this->serviceRequest->pdf_path || ! Storage::disk('public')->exists($this->serviceRequest->pdf_path)) {
            return [];
        }

        return [
            Attachment::fromStorageDisk('public', $this->serviceRequest->pdf_path)
                ->as($this->serviceRequest->reference_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
