<?php

namespace App\Services\Announcements;

use App\Models\Announcement;
use App\Models\AnnouncementSetting;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\Wasender\WasenderWhatsAppService;
use App\Services\WhatsApp\WhatsAppService;
use App\Support\PhoneFormatter;
use App\Support\WasenderRateLimiter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AnnouncementService
{
    private WhatsAppService $whatsapp;
    private WasenderWhatsAppService $wasender;

    public function __construct(WhatsAppService $whatsapp, WasenderWhatsAppService $wasender)
    {
        $this->whatsapp = $whatsapp;
        $this->wasender = $wasender;
    }

    public function createAndMaybeSend(array $data, ?int $userId, bool $sendNow = false): Announcement
    {
        $settings = AnnouncementSetting::singleton();
        $recipients = $this->resolveRecipients($data['audience_type'], $data['recipients'] ?? []);

        $announcement = Announcement::create([
            'reference' => $settings->allocateReference(),
            'title' => $data['title'],
            'category' => $data['category'] ?? null,
            'header' => $data['header'] ?? $settings->default_header,
            'body' => $data['body'],
            'footer' => $data['footer'] ?? config('wasender.company_name'),
            'audience_type' => $data['audience_type'],
            'recipients' => $recipients,
            'status' => ($data['scheduled_at'] ?? null) ? 'scheduled' : 'draft',
            'whatsapp_status' => ($data['scheduled_at'] ?? null) ? 'scheduled' : 'draft',
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'attachments' => $data['attachments'] ?? [],
            'created_by' => $userId,
        ]);

        if ($sendNow) {
            $this->send($announcement);
        }

        return $announcement->fresh();
    }

    public function send(Announcement $announcement): Announcement
    {
        if (! $this->wasender->isConfigured()) {
            $announcement->update(['status' => 'failed', 'whatsapp_status' => 'failed']);

            throw new \RuntimeException('WasenderAPI not configured');
        }

        $announcement->update(['whatsapp_status' => 'pending']);
        $recipients = $announcement->recipients ?? [];
        $results = [];
        $sent = 0;
        $failed = 0;

        foreach ($recipients as $index => $recipient) {
            if ($index > 0) {
                WasenderRateLimiter::betweenRecipients();
            }

            $phone = PhoneFormatter::toE164($recipient['phone'] ?? null);
            if (! $phone) {
                $failed++;
                $results[] = ['phone' => $recipient['phone'] ?? null, 'success' => false, 'error' => 'Invalid phone'];
                continue;
            }

            $text = $this->buildMessage($announcement, $recipient);
            $result = $this->whatsapp->sendNotification(
                $phone,
                $text,
                'announcement',
                Announcement::class,
                $announcement->id
            );

            if ($result['success'] ?? false) {
                $sent++;
                $this->sendAttachments($phone, $announcement);
                $results[] = ['phone' => $phone, 'success' => true];
            } else {
                $failed++;
                $results[] = ['phone' => $phone, 'success' => false, 'error' => $result['error'] ?? 'Send failed'];
            }
        }

        $status = $sent === 0 ? 'failed' : ($failed > 0 ? 'partial' : 'sent');

        $announcement->update([
            'status' => $status,
            'whatsapp_status' => $status,
            'sent_count' => $sent,
            'failed_count' => $failed,
            'send_results' => $results,
            'sent_at' => now(),
        ]);

        return $announcement->fresh();
    }

    public function processScheduled(): int
    {
        $due = Announcement::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($due as $announcement) {
            try {
                $this->send($announcement);
                $count++;
            } catch (\Throwable $e) {
                Log::error('Scheduled announcement failed', ['id' => $announcement->id, 'error' => $e->getMessage()]);
            }
        }

        return $count;
    }

    /** @return array<int, array<string, mixed>> */
    public function resolveRecipients(string $audienceType, array $custom): array
    {
        if ($audienceType === 'clients') {
            return ServiceRequest::select('client_name as name', 'client_phone as phone', 'client_email as email')
                ->whereNotNull('client_phone')
                ->distinct()
                ->get()
                ->map(fn ($r) => ['name' => $r->name, 'phone' => $r->phone, 'email' => $r->email])
                ->unique('phone')
                ->values()
                ->all();
        }

        if ($audienceType === 'staff') {
            return User::whereHas('roles', fn ($q) => $q->where('name', '!=', 'client'))
                ->whereNotNull('phone')
                ->get(['name', 'phone', 'email'])
                ->map(fn ($u) => ['name' => $u->name, 'phone' => $u->phone, 'email' => $u->email])
                ->all();
        }

        return $custom;
    }

    /** @param UploadedFile[] $files */
    public function storeAttachments(array $files): array
    {
        $stored = [];
        foreach ($files as $file) {
            $path = $file->store('announcements', 'public');
            $stored[] = [
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
                'url' => Storage::disk('public')->url($path),
            ];
        }

        return $stored;
    }

    private function buildMessage(Announcement $announcement, array $recipient): string
    {
        $parts = array_filter([
            $announcement->header,
            $this->personalize($announcement->body, $recipient, $announcement),
            $announcement->footer,
        ]);

        return implode("\n\n", $parts);
    }

    private function personalize(string $text, array $recipient, Announcement $announcement): string
    {
        $replacements = [
            '{name}' => $recipient['name'] ?? '',
            '{email}' => $recipient['email'] ?? '',
            '{phone}' => $recipient['phone'] ?? '',
            '{reference}' => $announcement->reference,
            '{date}' => now()->format('d M Y'),
            '[CustomerName]' => $recipient['name'] ?? '',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }

    private function sendAttachments(string $phone, Announcement $announcement): void
    {
        foreach ($announcement->attachments ?? [] as $attachment) {
            WasenderRateLimiter::beforeAttachment();

            $path = $attachment['path'] ?? null;
            if (! $path || ! Storage::disk('public')->exists($path)) {
                continue;
            }

            $content = Storage::disk('public')->get($path);
            $mime = $attachment['mime'] ?? 'application/octet-stream';
            $upload = $this->wasender->uploadBuffer($content, $mime);

            if (! ($upload['success'] ?? false) || ! ($upload['public_url'] ?? null)) {
                continue;
            }

            $url = $upload['public_url'];
            $name = $attachment['name'] ?? basename($path);

            if (str_starts_with($mime, 'image/')) {
                $this->wasender->sendImageMessage($phone, $url, $announcement->title);
            } else {
                $this->whatsapp->sendDocument(
                    $phone,
                    $url,
                    'announcement_attachment',
                    $announcement->title,
                    $name,
                    Announcement::class,
                    $announcement->id
                );
            }
        }
    }
}
