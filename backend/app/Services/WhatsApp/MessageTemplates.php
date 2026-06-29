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
        $loginUrl = config('app.frontend_url').'/login';

        return implode("\n", array_filter([
            '*New Service Request — Action Required*',
            '',
            "Ref: *{$request->reference_number}*",
            "Client: {$request->client_name}",
            "Phone: {$request->client_phone}",
            "Event: {$request->event_title} ({$request->event_type})",
            "Date: {$request->event_date->format('d M Y')}",
            "Services: {$services}",
            $request->venue ? "Venue: {$request->venue}" : null,
            '',
            "Login: {$loginUrl}",
            "Review / Approve / Deny: {$reviewUrl}",
            '',
            config('wasender.company_name'),
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

    public static function quotationPrepared(ServiceRequest $request, string $trackingUrl, float $amount, ?string $notes = null): string
    {
        $formatted = number_format($amount, 0).' RWF';

        return implode("\n", array_filter([
            "Hello {$request->client_name},",
            '',
            "Your quotation for request *{$request->reference_number}* is ready.",
            '',
            "Amount: *{$formatted}*",
            "Event: {$request->event_title}",
            $notes ? "Notes: {$notes}" : null,
            '',
            "Review and accept: {$trackingUrl}",
            '',
            config('wasender.company_name'),
        ], fn ($line) => $line !== null));
    }

    public static function requestAssignedStaff(ServiceRequest $request, string $reviewUrl, string $assigneeName): string
    {
        return implode("\n", array_filter([
            "*Request Assigned to You*",
            '',
            "Hello {$assigneeName},",
            '',
            "Ref: *{$request->reference_number}*",
            "Client: {$request->client_name} ({$request->client_phone})",
            "Event: {$request->event_title}",
            "Date: {$request->event_date->format('d M Y')}",
            $request->venue ? "Venue: {$request->venue}" : null,
            '',
            "Login: ".config('app.frontend_url').'/login',
            "Review: {$reviewUrl}",
            '',
            config('wasender.company_name'),
        ], fn ($line) => $line !== null));
    }

    public static function taskAssigned(\App\Models\StaffTask $task, string $assigneeName, ?string $creatorName = null): string
    {
        $loginUrl = config('app.frontend_url').'/login';
        $tasksUrl = config('app.frontend_url').'/admin/tasks';

        return implode("\n", array_filter([
            '*New Task Assigned*',
            '',
            "Hello {$assigneeName},",
            '',
            "Task: *{$task->title}*",
            $task->description ? "Details: {$task->description}" : null,
            "Priority: ".strtoupper($task->priority),
            $task->due_date ? "Due: {$task->due_date->format('d M Y')}" : null,
            $creatorName ? "Assigned by: {$creatorName}" : null,
            $task->serviceRequest ? "Request: {$task->serviceRequest->reference_number}" : null,
            '',
            "Login: {$loginUrl}",
            "View tasks: {$tasksUrl}",
            '',
            config('wasender.company_name'),
        ], fn ($line) => $line !== null));
    }

    public static function taskReminder(\App\Models\StaffTask $task, string $assigneeName, string $reminderType): string
    {
        $urgency = match ($reminderType) {
            'overdue' => '⚠️ *OVERDUE*',
            'due_today' => '📅 *Due Today*',
            'due_tomorrow' => '⏰ *Due Tomorrow*',
            default => '🔔 *Task Reminder*',
        };

        $tasksUrl = config('app.frontend_url').'/admin/tasks';

        return implode("\n", array_filter([
            "{$urgency}",
            '',
            "Hello {$assigneeName},",
            '',
            "Task: *{$task->title}*",
            "Status: ".str_replace('_', ' ', $task->status),
            $task->due_date ? "Due: {$task->due_date->format('d M Y')}" : 'No due date set',
            $task->serviceRequest ? "Linked request: {$task->serviceRequest->reference_number}" : null,
            '',
            "View tasks: {$tasksUrl}",
            '',
            config('wasender.company_name'),
        ], fn ($line) => $line !== null));
    }

    public static function taskStatusUpdate(\App\Models\StaffTask $task, string $assigneeName): string
    {
        $status = strtoupper(str_replace('_', ' ', $task->status));

        return implode("\n", [
            '*Task Status Updated*',
            '',
            "Hello {$assigneeName},",
            '',
            "Task: *{$task->title}*",
            "New status: *{$status}*",
            '',
            "View: ".config('app.frontend_url').'/admin/tasks',
            '',
            config('wasender.company_name'),
        ]);
    }
}
