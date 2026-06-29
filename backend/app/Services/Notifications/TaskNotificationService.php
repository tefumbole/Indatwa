<?php

namespace App\Services\Notifications;

use App\Models\StaffTask;
use App\Models\User;
use App\Services\WhatsApp\MessageTemplates;
use App\Services\WhatsApp\WhatsAppService;
use App\Support\PhoneFormatter;
use Illuminate\Support\Facades\Log;

class TaskNotificationService
{
    private WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function notifyAssigned(StaffTask $task): void
    {
        if (! $this->whatsapp->isConfigured() || ! $task->assigned_to) {
            return;
        }

        $task->load(['assignee', 'creator', 'serviceRequest']);

        $assignee = $task->assignee;
        if (! $assignee || ! $assignee->phone) {
            return;
        }

        $phone = PhoneFormatter::toE164($assignee->phone);
        if (! $phone) {
            return;
        }

        $text = MessageTemplates::taskAssigned(
            $task,
            $assignee->name,
            $task->creator?->name
        );

        $result = $this->whatsapp->sendNotification(
            $phone,
            $text,
            'task_assigned',
            StaffTask::class,
            $task->id,
            $assignee->id
        );

        if ($result['success'] ?? false) {
            $task->update(['assignment_notified_at' => now()]);
        }
    }

    public function notifyStatusChange(StaffTask $task, ?string $previousStatus = null): void
    {
        if (! $this->whatsapp->isConfigured() || ! $task->assigned_to) {
            return;
        }

        if ($previousStatus && $previousStatus === $task->status) {
            return;
        }

        $task->load(['assignee']);
        $assignee = $task->assignee;
        if (! $assignee || ! $assignee->phone) {
            return;
        }

        $phone = PhoneFormatter::toE164($assignee->phone);
        if (! $phone) {
            return;
        }

        $text = MessageTemplates::taskStatusUpdate($task, $assignee->name);

        $this->whatsapp->sendNotification(
            $phone,
            $text,
            'task_status_update',
            StaffTask::class,
            $task->id,
            $assignee->id
        );
    }

    /** Send due-date reminders for pending/in-progress tasks. */
    public function sendDueReminders(): array
    {
        if (! $this->whatsapp->isConfigured()) {
            return ['sent' => 0, 'skipped' => 0, 'reason' => 'not_configured'];
        }

        $today = now()->startOfDay();
        $tomorrow = now()->addDay()->startOfDay();

        $tasks = StaffTask::with(['assignee', 'serviceRequest'])
            ->whereNotNull('assigned_to')
            ->whereIn('status', ['pending', 'in_progress'])
            ->where(function ($q) use ($today) {
                $q->whereDate('due_date', '<=', $today)
                    ->orWhereDate('due_date', $tomorrow);
            })
            ->get();

        $sent = 0;
        $skipped = 0;

        foreach ($tasks as $task) {
            $reminderType = $this->resolveReminderType($task);
            if (! $reminderType) {
                $skipped++;
                continue;
            }

            if ($this->alreadyReminded($task, $reminderType)) {
                $skipped++;
                continue;
            }

            if ($this->sendReminder($task, $reminderType)) {
                $sent++;
            } else {
                $skipped++;
            }
        }

        return ['sent' => $sent, 'skipped' => $skipped];
    }

    private function resolveReminderType(StaffTask $task): ?string
    {
        if (! $task->due_date) {
            return null;
        }

        $due = $task->due_date->startOfDay();
        $today = now()->startOfDay();

        if ($due->lt($today)) {
            return 'overdue';
        }

        if ($due->eq($today)) {
            return 'due_today';
        }

        if ($due->eq($today->copy()->addDay())) {
            return 'due_tomorrow';
        }

        return null;
    }

    private function alreadyReminded(StaffTask $task, string $reminderType): bool
    {
        if (! $task->last_reminder_at) {
            return false;
        }

        $sameType = $task->last_reminder_type === $reminderType;
        $recent = $task->last_reminder_at->isToday();

        return $sameType && $recent;
    }

    private function sendReminder(StaffTask $task, string $reminderType): bool
    {
        $assignee = $task->assignee;
        if (! $assignee || ! $assignee->phone) {
            return false;
        }

        $phone = PhoneFormatter::toE164($assignee->phone);
        if (! $phone) {
            return false;
        }

        $text = MessageTemplates::taskReminder($task, $assignee->name, $reminderType);

        $result = $this->whatsapp->sendNotification(
            $phone,
            $text,
            'task_reminder_'.$reminderType,
            StaffTask::class,
            $task->id,
            $assignee->id
        );

        if ($result['success'] ?? false) {
            $task->update([
                'last_reminder_at' => now(),
                'last_reminder_type' => $reminderType,
            ]);

            return true;
        }

        Log::warning('Task reminder WhatsApp failed', [
            'task_id' => $task->id,
            'error' => $result['error'] ?? 'unknown',
        ]);

        return false;
    }
}
