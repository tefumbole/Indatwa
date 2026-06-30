<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QrCodeService
{
    /** @return string|null Base64 PNG data URI */
    public function pngDataUri(string $url, int $size = 120): ?string
    {
        try {
            $response = Http::timeout(15)->get('https://quickchart.io/qr', [
                'text' => $url,
                'size' => $size,
                'margin' => 1,
            ]);

            if ($response->successful()) {
                return 'data:image/png;base64,'.base64_encode($response->body());
            }
        } catch (\Throwable $e) {
            Log::warning('QR generation failed', ['url' => $url, 'error' => $e->getMessage()]);
        }

        return null;
    }

    public function trackUrl(string $trackingToken): string
    {
        return rtrim(config('app.frontend_url'), '/').'/track/'.$trackingToken;
    }
}
