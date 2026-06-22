<?php

namespace App\Services\WhatsApp;

use App\Models\ServiceRequest;

class MessageTemplates
{
    public static function otp(string $otp, string $context = 'login'): string
    {
        $company = config('wasender.company_name');
        switch ($context) {
            case 'login':
                $action = 'sign in to your account';
                break;
            case 'register':
                $action = 'complete your registration';
                break;
            default:
                $action = 'verify your request';
        }

        return implode("\n", [
            "*{$company}*",
            '',
            "Your verification code to {$action}:",
            '',
            "*{$otp}*",
            '',
            'Valid for 10 minutes. Do not share this code.',
        ]);
    }

    public static function buildMessage(string $templateType, array $data): string
    {
        switch ($templateType) {
            case 'otp':
                return self::otp($data['otp'] ?? '', $data['context'] ?? 'login');
            case 'status_update':
                return self::statusUpdate($data['request'], $data['tracking_url']);
            default:
                return $data['text'] ?? '';
        }
    }

    public static function requestReceivedClient(ServiceRequest $request, string $trackingUrl): string
    {
        $company = config('wasender.company_name');
        $services = $request->items->pluck('service_name')->join(', ');

        return implode("\n", [
            "Hello {$request->client_name},",
            '',
            "Your service request has been received and is under review.",
            '',
            "Reference: *{$request->reference_number}*",
            "Event: {$request->event_title}",
            "Date: {$request->event_date->format('d M Y')}",
            "Services: {$services}",
            '',
            "Track your request: {$trackingUrl}",
            '',
            "A PDF copy of your request is attached.",
            '',
            "Thank you for choosing {$company}.",
        ]);
    }

    public static function requestReceivedAdmin(ServiceRequest $request, string $reviewUrl): string
    {
        $services = $request->items->pluck('service_name')->join(', ');

        return implode("\n", array_filter([
            '*New Service Request*',
            '',
            "Ref: *{$request->reference_number}*",
            "Client: {$request->client_name}",
            "Phone: {$request->client_phone}",
            "Event: {$request->event_title} ({$request->event_type})",
            "Date: {$request->event_date->format('d M Y')}",
            "Services: {$services}",
            $request->venue ? "Venue: {$request->venue}" : null,
            '',
            "Review: {$reviewUrl}",
            '',
            'PDF attached.',
        ], fn ($line) => $line !== null));
    }

    public static function statusUpdate(ServiceRequest $request, string $trackingUrl): string
    {
        $status = strtoupper(str_replace('_', ' ', $request->status));

        return implode("\n", [
            "Hello {$request->client_name},",
            '',
            "Your request *{$request->reference_number}* status has been updated.",
            '',
            "New Status: *{$status}*",
            "Track: {$trackingUrl}",
            '',
            config('wasender.company_name'),
        ]);
    }
}
