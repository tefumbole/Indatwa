<?php

namespace App\Services\Notifications;

use App\Mail\NewServiceRequestAdminMail;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\NewServiceRequestNotification;
use App\Services\RequestPdfService;
use App\Services\Wasender\AdminPhoneService;
use App\Services\Wasender\WasenderWhatsAppService;
use App\Services\WhatsApp\MessageTemplates;
use App\Services\WhatsApp\WhatsAppService;
use App\Support\PhoneFormatter;
use App\Support\WasenderRateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class RequestNotificationService
{
    private $wasender;
    private $whatsapp;
    private $adminPhones;
    private $pdfService;

    public function __construct(
        WasenderWhatsAppService $wasender,
        WhatsAppService $whatsapp,
        AdminPhoneService $adminPhones,
        RequestPdfService $pdfService
    ) {
        $this->wasender = $wasender;
        $this->whatsapp = $whatsapp;
        $this->adminPhones = $adminPhones;
        $this->pdfService = $pdfService;
    }

    public function sendSubmitted(ServiceRequest $request): void
    {
        $request->load(['items', 'documents']);

        $trackingUrl = config('app.frontend_url').'/track/'.$request->tracking_token;
        $reviewUrl = config('app.frontend_url').'/admin/requests/'.$request->id;
        $pdfPublicUrl = $this->resolvePdfUrl($request);

        $this->notifyClient($request, $trackingUrl, $pdfPublicUrl);
        $this->notifyAdminsWhatsApp($request, $reviewUrl, $pdfPublicUrl);
        $this->notifyAdminsEmail($request, $trackingUrl, $reviewUrl);
        $this->notifyAdminsDashboard($request, $trackingUrl, $reviewUrl);
    }

    public function sendStatusUpdate(ServiceRequest $request, ?string $note = null): void
    {
        if (! $this->wasender->isConfigured()) {
            return;
        }

        $request->load(['items']);
        $trackingUrl = config('app.frontend_url').'/track/'.$request->tracking_token;
        $phone = PhoneFormatter::toE164($request->client_phone);

        if (! $phone) {
            return;
        }

        $text = MessageTemplates::statusUpdate($request, $trackingUrl);
        if ($note) {
            $text .= "\n\nNote: {$note}";
        }

        $this->whatsapp->sendNotification($phone, $text, 'status_update', ServiceRequest::class, $request->id);

        if (in_array($request->status, ['approved', 'rejected', 'quotation_prepared', 'awaiting_payment'], true)) {
            $pdfUrl = $this->resolvePdfUrl($request);
            if ($pdfUrl) {
                WasenderRateLimiter::beforeAttachment();
                $this->whatsapp->sendDocument(
                    $phone,
                    $pdfUrl,
                    'status_pdf',
                    'Updated request PDF — '.$request->reference_number,
                    $request->reference_number.'.pdf',
                    ServiceRequest::class,
                    $request->id,
                );
            }
        }
    }

    public function sendQuotation(ServiceRequest $request, float $amount, ?string $notes = null): void
    {
        if (! $this->wasender->isConfigured()) {
            return;
        }

        $request->load(['items']);
        $trackingUrl = config('app.frontend_url').'/track/'.$request->tracking_token;
        $phone = PhoneFormatter::toE164($request->client_phone);

        if (! $phone) {
            return;
        }

        $text = MessageTemplates::quotationPrepared($request, $trackingUrl, $amount, $notes);
        $this->whatsapp->sendNotification($phone, $text, 'quotation_prepared', ServiceRequest::class, $request->id);

        $pdfUrl = $this->resolvePdfUrl($request);
        if ($pdfUrl) {
            WasenderRateLimiter::beforeAttachment();
            $this->whatsapp->sendDocument(
                $phone,
                $pdfUrl,
                'quotation_pdf',
                'Quotation PDF — '.$request->reference_number,
                $request->reference_number.'.pdf',
                ServiceRequest::class,
                $request->id,
            );
        }
    }

    public function sendClientConfirmed(ServiceRequest $request): void
    {
        if (! $this->wasender->isConfigured()) {
            return;
        }

        $request->load(['items']);
        $trackingUrl = config('app.frontend_url').'/track/'.$request->tracking_token;
        $phone = PhoneFormatter::toE164($request->client_phone);

        if (! $phone) {
            return;
        }

        $amount = $request->quoted_amount ? number_format((float) $request->quoted_amount, 0).' RWF' : 'as quoted';
        $text = "Dear {$request->client_name},\n\n"
            ."Your quotation for *{$request->reference_number}* ({$request->event_title}) has been confirmed.\n"
            ."Total: {$amount}\n\n"
            ."Track your request: {$trackingUrl}\n\n"
            .config('ips.company_name');

        $this->whatsapp->sendNotification($phone, $text, 'quotation_confirmed', ServiceRequest::class, $request->id);

        $pdfUrl = $this->resolvePdfUrl($request);
        if ($pdfUrl) {
            WasenderRateLimiter::beforeAttachment();
            $this->whatsapp->sendDocument(
                $phone,
                $pdfUrl,
                'confirmed_pdf',
                'Confirmed quotation PDF — '.$request->reference_number,
                $request->reference_number.'.pdf',
                ServiceRequest::class,
                $request->id,
            );
        }
    }

    public function notifyAssignee(ServiceRequest $request, User $assignee): void
    {
        if (! $this->wasender->isConfigured() || ! $assignee->phone) {
            return;
        }

        $phone = PhoneFormatter::toE164($assignee->phone);
        if (! $phone) {
            return;
        }

        $reviewUrl = config('app.frontend_url').'/admin/requests/'.$request->id;
        $text = MessageTemplates::requestAssignedStaff($request, $reviewUrl, $assignee->name);

        $this->whatsapp->sendNotification(
            $phone,
            $text,
            'request_assigned',
            ServiceRequest::class,
            $request->id,
            $assignee->id
        );
    }

    private function notifyClient(ServiceRequest $request, string $trackingUrl, ?string $pdfUrl): void
    {
        if (! $this->wasender->isConfigured()) {
            Log::info('WasenderAPI not configured — skipping client WhatsApp', ['request' => $request->reference_number]);

            return;
        }

        $phone = PhoneFormatter::toE164($request->client_phone);
        if (! $phone) {
            Log::warning('Invalid client phone for WhatsApp', ['request' => $request->reference_number]);

            return;
        }

        $text = MessageTemplates::requestReceivedClient($request, $trackingUrl);
        $this->whatsapp->sendNotification($phone, $text, 'request_received', ServiceRequest::class, $request->id);

        if ($pdfUrl) {
            WasenderRateLimiter::beforeAttachment();
            $this->whatsapp->sendDocument(
                $phone,
                $pdfUrl,
                'request_pdf',
                'Your request PDF — '.$request->reference_number,
                $request->reference_number.'.pdf',
                ServiceRequest::class,
                $request->id,
            );
        }
    }

    private function notifyAdminsWhatsApp(ServiceRequest $request, string $reviewUrl, ?string $pdfUrl): void
    {
        if (! $this->wasender->isConfigured()) {
            return;
        }

        $phones = $this->adminPhones->getAdminPhones();
        $text = MessageTemplates::requestReceivedAdmin($request, $reviewUrl);

        foreach ($phones as $index => $phone) {
            if ($index > 0) {
                WasenderRateLimiter::betweenRecipients();
            }

            $this->whatsapp->sendNotification($phone, $text, 'admin_new_request', ServiceRequest::class, $request->id);

            if ($pdfUrl) {
                WasenderRateLimiter::beforeAttachment();
                $this->whatsapp->sendDocument(
                    $phone,
                    $pdfUrl,
                    'admin_request_pdf',
                    'New request PDF — '.$request->reference_number,
                    $request->reference_number.'.pdf',
                    ServiceRequest::class,
                    $request->id,
                );
            }
        }
    }

    private function notifyAdminsEmail(ServiceRequest $request, string $trackingUrl, string $reviewUrl): void
    {
        $emails = $this->adminEmails();

        foreach ($emails as $email) {
            try {
                Mail::to($email)->send(new NewServiceRequestAdminMail($request, $trackingUrl, $reviewUrl));
            } catch (\Throwable $e) {
                Log::error('Admin email failed', ['email' => $email, 'error' => $e->getMessage()]);
            }
        }
    }

    private function notifyAdminsDashboard(ServiceRequest $request, string $trackingUrl, string $reviewUrl): void
    {
        $admins = User::whereHas('roles', fn ($q) => $q->whereIn('name', [
            'super_admin', 'director', 'operations_manager', 'customer_service',
        ]))->get();

        foreach ($admins as $admin) {
            $admin->notify(new NewServiceRequestNotification($request, $trackingUrl, $reviewUrl));
        }
    }

    private function resolvePdfUrl(ServiceRequest $request): ?string
    {
        if (! $request->pdf_path || ! Storage::disk('public')->exists($request->pdf_path)) {
            $this->pdfService->generate($request);
            $request->refresh();
        }

        if (! $request->pdf_path) {
            return null;
        }

        $pdfContent = Storage::disk('public')->get($request->pdf_path);

        if ($this->wasender->isConfigured()) {
            $upload = $this->wasender->uploadBuffer($pdfContent, 'application/pdf');
            if ($upload['success'] && $upload['public_url']) {
                return $upload['public_url'];
            }
        }

        return $this->pdfService->getPublicUrl($request);
    }

    /** @return string[] */
    private function adminEmails(): array
    {
        $emails = [config('wasender.admin_email')];

        $dbEmails = User::whereHas('roles', fn ($q) => $q->whereIn('name', [
            'super_admin', 'director', 'operations_manager', 'customer_service',
        ]))->whereNotNull('email')->pluck('email')->toArray();

        return array_values(array_unique(array_filter(array_merge($emails, $dbEmails))));
    }
}
