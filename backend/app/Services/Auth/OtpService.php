<?php

namespace App\Services\Auth;

use App\Services\WhatsApp\WhatsAppService;
use App\Support\PhoneFormatter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class OtpService
{
    private const TTL_MINUTES = 10;

    private $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function send(string $phone, string $context = 'login'): array
    {
        $e164 = PhoneFormatter::toE164($phone);
        if (! $e164) {
            return ['success' => false, 'message' => 'Invalid phone number'];
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put($this->cacheKey($e164, $context), $otp, now()->addMinutes(self::TTL_MINUTES));

        if ($this->whatsapp->isConfigured()) {
            $result = $this->whatsapp->sendOtp($e164, $otp, $context);
            if (! ($result['success'] ?? false)) {
                Log::warning('OTP WhatsApp send failed', ['phone' => $e164, 'error' => $result['error'] ?? null]);

                return ['success' => false, 'message' => 'Failed to send OTP via WhatsApp'];
            }
        } else {
            Log::info('Wasender not configured — OTP for dev', ['phone' => $e164, 'otp' => $otp]);
        }

        return ['success' => true, 'message' => 'OTP sent via WhatsApp', 'phone' => $e164];
    }

    public function verify(string $phone, string $otp, string $context = 'login'): bool
    {
        $e164 = PhoneFormatter::toE164($phone);
        if (! $e164) {
            return false;
        }

        $cached = Cache::get($this->cacheKey($e164, $context));

        if (! $cached || ! hash_equals($cached, $otp)) {
            return false;
        }

        Cache::forget($this->cacheKey($e164, $context));

        return true;
    }

    private function cacheKey(string $e164, string $context): string
    {
        return "otp:{$context}:{$e164}";
    }
}
