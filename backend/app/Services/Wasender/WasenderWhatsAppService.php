<?php

namespace App\Services\Wasender;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WasenderWhatsAppService
{
    public function isConfigured(): bool
    {
        return ! empty(config('wasender.api_key'));
    }

    public function sendTextMessage(string $to, string $text, ?string $messageType = null): array
    {
        return $this->request('post', '/send-message', [
            'to' => $to,
            'text' => $text,
        ], $to, $messageType ?? 'text');
    }

    public function sendOtp(string $to, string $otp, ?string $context = null): array
    {
        $company = config('wasender.company_name');
        $text = "Your {$company} verification code is: *{$otp}*. Valid for 10 minutes. Do not share this code.";

        return $this->sendTextMessage($to, $text, 'otp_'.($context ?? 'general'));
    }

    public function sendImageMessage(string $to, string $imageUrl, ?string $text = null): array
    {
        $payload = ['to' => $to, 'imageUrl' => $imageUrl];
        if ($text) {
            $payload['text'] = $text;
        }

        return $this->request('post', '/send-message', $payload, $to, 'image');
    }

    public function sendDocumentMessage(string $to, string $documentUrl, ?string $text = null, ?string $fileName = null): array
    {
        $payload = [
            'to' => $to,
            'documentUrl' => $documentUrl,
        ];

        if ($text) {
            $payload['text'] = $text;
        }

        if ($fileName) {
            $payload['fileName'] = $fileName;
        }

        return $this->request('post', '/send-message', $payload, $to, 'document');
    }

    public function uploadBuffer(string $buffer, string $mimeType = 'application/pdf', ?string $fileName = null): array
    {
        if (! $this->isConfigured()) {
            return ['success' => false, 'error' => 'WasenderAPI not configured', 'public_url' => null];
        }

        $uploadUrl = rtrim(config('wasender.base_url'), '/').'/upload';
        $fileName = $fileName ?: 'document.pdf';

        try {
            $response = Http::withToken(config('wasender.api_key'))
                ->timeout(120)
                ->withHeaders(['Content-Type' => $mimeType])
                ->withBody($buffer, $mimeType)
                ->post($uploadUrl);

            $data = $response->json();
            $publicUrl = $this->extractPublicUrl($data);

            if ($response->successful() && ($data['success'] ?? false) && $publicUrl) {
                return ['success' => true, 'public_url' => $publicUrl, 'error' => null];
            }

            // Multipart fallback (some Wasender setups expect a file field)
            $multipartResponse = Http::withToken(config('wasender.api_key'))
                ->timeout(120)
                ->attach('file', $buffer, $fileName, ['Content-Type' => $mimeType])
                ->post($uploadUrl);

            $multipartData = $multipartResponse->json();
            $multipartUrl = $this->extractPublicUrl($multipartData);

            if ($multipartResponse->successful() && ($multipartData['success'] ?? false) && $multipartUrl) {
                return ['success' => true, 'public_url' => $multipartUrl, 'error' => null];
            }

            Log::error('Wasender upload failed', [
                'raw_status' => $response->status(),
                'raw_body' => mb_substr($response->body(), 0, 500),
                'multipart_status' => $multipartResponse->status(),
                'multipart_body' => mb_substr($multipartResponse->body(), 0, 500),
            ]);

            return [
                'success' => false,
                'public_url' => null,
                'error' => $multipartData['message'] ?? $data['message'] ?? $response->body(),
            ];
        } catch (\Throwable $e) {
            Log::error('Wasender upload exception', ['error' => $e->getMessage()]);

            return ['success' => false, 'public_url' => null, 'error' => $e->getMessage()];
        }
    }

    private function extractPublicUrl(?array $data): ?string
    {
        if (! $data) {
            return null;
        }

        return $data['publicUrl']
            ?? ($data['data']['publicUrl'] ?? null)
            ?? $data['public_url']
            ?? ($data['data']['public_url'] ?? null)
            ?? $data['url']
            ?? null;
    }

    private function request(string $method, string $path, array $payload, string $phone, string $messageType): array
    {
        if (! $this->isConfigured()) {
            return $this->result(false, $phone, null, 'WasenderAPI not configured');
        }

        try {
            $response = Http::withToken(config('wasender.api_key'))
                ->acceptJson()
                ->$method(rtrim(config('wasender.base_url'), '/').$path, $payload);

            $data = $response->json();
            $success = $response->successful() && ($data['success'] ?? false);
            $msgId = $data['data']['msgId'] ?? $data['msgId'] ?? null;

            return $this->result($success, $phone, $msgId, $success ? null : ($data['message'] ?? $response->body()), $messageType);
        } catch (\Throwable $e) {
            Log::error('Wasender send failed', ['phone' => $phone, 'error' => $e->getMessage()]);

            return $this->result(false, $phone, null, $e->getMessage(), $messageType);
        }
    }

    private function result(bool $success, string $phone, ?string $sid, ?string $error, ?string $type = null): array
    {
        return [
            'success' => $success,
            'status' => $success ? 'sent' : 'failed',
            'phone_number' => $phone,
            'provider_sid' => $sid,
            'messageSid' => $sid,
            'message_type' => $type,
            'error' => $error,
        ];
    }
}
