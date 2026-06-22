<?php

namespace App\Services\WhatsApp;

use App\Services\Wasender\WasenderWhatsAppService;

/**
 * High-level WhatsApp send wrapper (New Vision whatsappService.js pattern).
 */
class WhatsAppService
{
    private $wasender;
    private $logger;

    public function __construct(WasenderWhatsAppService $wasender, WhatsAppNotificationLogger $logger)
    {
        $this->wasender = $wasender;
        $this->logger = $logger;
    }

    public function isConfigured(): bool
    {
        return $this->wasender->isConfigured();
    }

    public function sendNotification(
        string $phone,
        string $text,
        string $messageType = 'notification',
        ?string $relatedType = null,
        ?int $relatedId = null,
        ?int $userId = null
    ): array {
        $result = $this->wasender->sendTextMessage($phone, $text, $messageType);
        $this->logger->log($phone, $messageType, $text, $result, $relatedType, $relatedId, $userId);

        return $result;
    }

    public function sendOtp(
        string $phone,
        string $otp,
        string $context = 'login',
        ?int $userId = null
    ): array {
        $text = MessageTemplates::otp($otp, $context);
        $result = $this->wasender->sendOtp($phone, $otp, $context);
        $this->logger->log($phone, 'otp_'.$context, $text, $result, null, null, $userId);

        return $result;
    }

    public function sendDocument(
        string $phone,
        string $documentUrl,
        string $messageType,
        ?string $text = null,
        ?string $fileName = null,
        ?string $relatedType = null,
        ?int $relatedId = null
    ): array {
        $result = $this->wasender->sendDocumentMessage($phone, $documentUrl, $text, $fileName);
        $this->logger->log($phone, $messageType, $text ?? 'Document', $result, $relatedType, $relatedId);

        return $result;
    }
}
