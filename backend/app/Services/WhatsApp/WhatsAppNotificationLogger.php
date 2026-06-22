<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\DB;

class WhatsAppNotificationLogger
{
    public function log(
        string $phone,
        string $messageType,
        string $message,
        array $result,
        ?string $relatedType = null,
        ?int $relatedId = null,
        ?int $userId = null
    ): void {
        DB::table('whatsapp_notifications')->insert([
            'user_id' => $userId,
            'phone' => $phone,
            'message_type' => $messageType,
            'message' => mb_substr($message, 0, 5000),
            'status' => ($result['success'] ?? false) ? 'sent' : 'failed',
            'provider_sid' => $result['provider_sid'] ?? $result['messageSid'] ?? null,
            'related_type' => $relatedType,
            'related_id' => $relatedId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
