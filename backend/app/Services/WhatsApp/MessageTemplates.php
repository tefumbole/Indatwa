<?php

namespace App\Services\WhatsApp;

use App\Models\ServiceRequest;
use Illuminate\Support\Collection;

class MessageTemplates
{
    private static function header(string $emoji, string $title): string
    {
        return "{$emoji} *".strtoupper($title)."*\n───────────────";
    }

    private static function sign(): string
    {
        return '_'.config('wasender.company_name').'_';
    }

    /** @param Collection<int, \App\Models\ServiceRequestItem> $items */
    private static function formatQuotedServicesBreakdown(Collection $items, ?float $miscellaneous = null): string
    {
        $approved = $items->where('status', 'approved');
        if ($approved->isEmpty()) {
            return '■ *Services:* (none quoted)';
        }

        $lines = $approved->map(function ($i) {
            $price = $i->quoted_price !== null
                ? number_format((float) $i->quoted_price, 0).' RWF'
                : '—';

            return "   • {$i->service_name}: *{$price}*";
        })->join("\n");

        $block = "■ *Services & amounts:*\n{$lines}";

        if ($miscellaneous !== null && $miscellaneous > 0) {
            $block .= "\n   • Miscellaneous: *".number_format($miscellaneous, 0).' RWF*';
        }

        return $block;
    }

    /** @param Collection<int, \App\Models\ServiceRequestItem> $items */
    private static function formatServicesList(Collection $items): string
    {
        if ($items->isEmpty()) {
            return '■ *Services:* (none listed)';
        }

        $lines = $items->map(fn ($i) => "   • {$i->service_name}")->join("\n");

        return "■ *Services:*\n{$lines}";
    }

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
            self::header('🔐', 'Verification Code'),
            '',
            "Your verification code to {$action}:",
            '',
            "*{$otp}*",
            '',
            'Valid for 10 minutes. Do not share this code.',
            '',
            self::sign(),
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

    public static function requestReceivedClient(ServiceRequest $request, string $trackingUrl, bool $pdfAttached = true): string
    {
        $lines = [
            self::header('📋', 'Service Request Received'),
            '',
            "Hello {$request->client_name},",
            '',
            'Your service request has been received and is under review.',
            '',
            "■ *Reference:* {$request->reference_number}",
            "■ *Event:* {$request->event_title}",
            "■ *Date:* {$request->event_date->format('d M Y')}",
            self::formatServicesList($request->items),
            '',
            "Track your request: {$trackingUrl}",
        ];

        if ($pdfAttached) {
            $lines[] = '';
            $lines[] = 'A PDF copy of your request is attached.';
        }

        $lines[] = '';
        $lines[] = 'Thank you for choosing '.config('wasender.company_name').'.';
        $lines[] = '';
        $lines[] = self::sign();

        return implode("\n", $lines);
    }

    public static function requestReceivedAdmin(ServiceRequest $request, string $reviewUrl): string
    {
        $loginUrl = config('app.frontend_url').'/login';

        return implode("\n", array_filter([
            self::header('🆕', 'New Service Request'),
            '',
            'A new service request requires your review.',
            '',
            "■ *Reference:* {$request->reference_number}",
            "■ *Client:* {$request->client_name}",
            "■ *Phone:* {$request->client_phone}",
            "■ *Event:* {$request->event_title} ({$request->event_type})",
            "■ *Date:* {$request->event_date->format('d M Y')}",
            self::formatServicesList($request->items),
            $request->venue ? "■ *Venue:* {$request->venue}" : null,
            '',
            "Login: {$loginUrl}",
            "Review / Approve / Deny: {$reviewUrl}",
            '',
            'A PDF copy is attached.',
            '',
            self::sign(),
        ], fn ($line) => $line !== null));
    }

    public static function statusUpdate(ServiceRequest $request, string $trackingUrl): string
    {
        $status = strtoupper(str_replace('_', ' ', $request->status));

        return implode("\n", [
            self::header('📢', 'Request Status Update'),
            '',
            "Hello {$request->client_name},",
            '',
            "Your request status has been updated.",
            '',
            "■ *Reference:* {$request->reference_number}",
            "■ *Event:* {$request->event_title}",
            "■ *New Status:* {$status}",
            '',
            "Track your request: {$trackingUrl}",
            '',
            self::sign(),
        ]);
    }

    public static function quotationPrepared(ServiceRequest $request, string $trackingUrl, float $amount, ?string $notes = null, ?float $miscellaneous = null): string
    {
        $formatted = number_format($amount, 0).' RWF';
        $misc = $miscellaneous ?? (float) ($request->miscellaneous_amount ?? 0);

        return implode("\n", array_filter([
            self::header('💰', 'Quotation Ready'),
            '',
            "Hello {$request->client_name},",
            '',
            'Your quotation is ready for review.',
            '',
            "■ *Reference:* {$request->reference_number}",
            "■ *Event:* {$request->event_title}",
            self::formatQuotedServicesBreakdown($request->items, $misc > 0 ? $misc : null),
            "■ *Total:* {$formatted}",
            $notes ? "■ *Notes:* {$notes}" : null,
            '',
            "Review and accept: {$trackingUrl}",
            '',
            'A PDF quotation is attached.',
            '',
            self::sign(),
        ], fn ($line) => $line !== null));
    }

    public static function serviceReviewUpdate(ServiceRequest $request, $item, string $status, string $comment, string $trackingUrl): string
    {
        $statusLabel = ucfirst($status);

        return implode("\n", [
            self::header('📋', 'Service Update'),
            '',
            "Hello {$request->client_name},",
            '',
            "An update on your request *{$request->reference_number}*.",
            '',
            "■ *Service:* {$item->service_name}",
            "■ *Status:* {$statusLabel}",
            "■ *Message:* {$comment}",
            '',
            "View details: {$trackingUrl}",
            '',
            self::sign(),
        ]);
    }

    public static function clientConfirmed(ServiceRequest $request, string $trackingUrl): string
    {
        $amount = $request->quoted_amount
            ? number_format((float) $request->quoted_amount, 0).' RWF'
            : 'as quoted';

        return implode("\n", [
            self::header('✅', 'Quotation Confirmed'),
            '',
            "Hello {$request->client_name},",
            '',
            'Your quotation has been confirmed. Thank you!',
            '',
            "■ *Reference:* {$request->reference_number}",
            "■ *Event:* {$request->event_title}",
            "■ *Total:* {$amount}",
            '',
            "Track your request: {$trackingUrl}",
            '',
            'A confirmed PDF is attached.',
            '',
            self::sign(),
        ]);
    }

    public static function requestAssignedStaff(ServiceRequest $request, string $reviewUrl, string $assigneeName): string
    {
        return implode("\n", array_filter([
            self::header('👤', 'Request Assigned'),
            '',
            "Hello {$assigneeName},",
            '',
            'A service request has been assigned to you.',
            '',
            "■ *Reference:* {$request->reference_number}",
            "■ *Client:* {$request->client_name} ({$request->client_phone})",
            "■ *Event:* {$request->event_title}",
            "■ *Date:* {$request->event_date->format('d M Y')}",
            $request->venue ? "■ *Venue:* {$request->venue}" : null,
            '',
            "Login: ".config('app.frontend_url').'/login',
            "Review: {$reviewUrl}",
            '',
            self::sign(),
        ], fn ($line) => $line !== null));
    }

    public static function taskAssigned(\App\Models\StaffTask $task, string $assigneeName, ?string $creatorName = null): string
    {
        $loginUrl = config('app.frontend_url').'/login';
        $tasksUrl = config('app.frontend_url').'/admin/tasks';

        return implode("\n", array_filter([
            self::header('📌', 'New Task Assigned'),
            '',
            "Hello {$assigneeName},",
            '',
            "■ *Task:* {$task->title}",
            $task->description ? "■ *Details:* {$task->description}" : null,
            "■ *Priority:* ".strtoupper($task->priority),
            $task->due_date ? "■ *Due:* {$task->due_date->format('d M Y')}" : null,
            $creatorName ? "■ *Assigned by:* {$creatorName}" : null,
            $task->serviceRequest ? "■ *Request:* {$task->serviceRequest->reference_number}" : null,
            '',
            "Login: {$loginUrl}",
            "View tasks: {$tasksUrl}",
            '',
            self::sign(),
        ], fn ($line) => $line !== null));
    }

    public static function taskReminder(\App\Models\StaffTask $task, string $assigneeName, string $reminderType): string
    {
        $header = match ($reminderType) {
            'overdue' => self::header('⚠️', 'Overdue Task'),
            'due_today' => self::header('📅', 'Task Due Today'),
            'due_tomorrow' => self::header('⏰', 'Task Due Tomorrow'),
            default => self::header('🔔', 'Task Reminder'),
        };

        $tasksUrl = config('app.frontend_url').'/admin/tasks';

        return implode("\n", array_filter([
            $header,
            '',
            "Hello {$assigneeName},",
            '',
            "■ *Task:* {$task->title}",
            "■ *Status:* ".str_replace('_', ' ', $task->status),
            $task->due_date ? "■ *Due:* {$task->due_date->format('d M Y')}" : '■ *Due:* No due date set',
            $task->serviceRequest ? "■ *Linked request:* {$task->serviceRequest->reference_number}" : null,
            '',
            "View tasks: {$tasksUrl}",
            '',
            self::sign(),
        ], fn ($line) => $line !== null));
    }

    public static function taskStatusUpdate(\App\Models\StaffTask $task, string $assigneeName): string
    {
        $status = strtoupper(str_replace('_', ' ', $task->status));

        return implode("\n", [
            self::header('🔄', 'Task Status Updated'),
            '',
            "Hello {$assigneeName},",
            '',
            "■ *Task:* {$task->title}",
            "■ *New status:* {$status}",
            '',
            "View: ".config('app.frontend_url').'/admin/tasks',
            '',
            self::sign(),
        ]);
    }
}
