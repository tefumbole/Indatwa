<?php

namespace App\Services;

use App\Models\ServiceRequest;
use App\Services\Wasender\WasenderWhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RequestPdfService
{
    public function generate(ServiceRequest $request, bool $hideAmounts = false): string
    {
        $request->load(['items', 'documents']);

        $signatureData = null;
        if ($request->signature_path && Storage::disk('local')->exists($request->signature_path)) {
            $signatureData = base64_encode(Storage::disk('local')->get($request->signature_path));
        }

        $settings = app(SiteSettingsService::class)->branding();
        $qr = app(QrCodeService::class)->pngDataUri(
            app(QrCodeService::class)->trackUrl($request->tracking_token)
        );

        $pdf = Pdf::loadView('pdf.request', [
            'request' => $request,
            'signatureData' => $signatureData,
            'companyName' => $settings['company_name'],
            'companyPhone' => $settings['company_phone'],
            'companyLocation' => $settings['company_location'],
            'headerHtml' => $settings['pdf_header_html'],
            'footerHtml' => $settings['pdf_footer_html'],
            'logoUrl' => $settings['logo_url'],
            'qrDataUri' => $qr,
            'hideAmounts' => $hideAmounts,
            'showAgreement' => (bool) $request->agreement_accepted,
            'agreementHtml' => $settings['rental_agreement_html'],
        ])->setPaper('a4');

        $path = "requests/{$request->reference_number}.pdf";
        Storage::disk('public')->put($path, $pdf->output());

        $request->update(['pdf_path' => $path]);
        $this->publishToWebRoot($request);

        return $path;
    }

    public function ensureExists(ServiceRequest $request): bool
    {
        if ($request->pdf_path && Storage::disk('public')->exists($request->pdf_path)) {
            return true;
        }

        try {
            $this->generate($request);
            $request->refresh();

            return $request->pdf_path && Storage::disk('public')->exists($request->pdf_path);
        } catch (\Throwable $e) {
            Log::error('PDF generation failed', [
                'request' => $request->reference_number,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Resolve a URL Wasender can fetch for WhatsApp document delivery.
     * Prefers Wasender CDN upload; falls back to static file on the public site.
     */
    public function whatsAppDocumentUrl(ServiceRequest $request, WasenderWhatsAppService $wasender): ?string
    {
        if (! $this->ensureExists($request)) {
            return null;
        }

        $pdfContent = Storage::disk('public')->get($request->pdf_path);
        $fileName = $request->reference_number.'.pdf';

        if ($wasender->isConfigured()) {
            $upload = $wasender->uploadBuffer($pdfContent, 'application/pdf', $fileName);
            if ($upload['success'] && $upload['public_url']) {
                return $upload['public_url'];
            }

            Log::warning('Wasender PDF upload failed, using static media URL', [
                'request' => $request->reference_number,
                'error' => $upload['error'] ?? 'unknown',
            ]);
        }

        $staticUrl = $this->publishToWebRoot($request);
        if ($staticUrl && $this->urlIsReachable($staticUrl)) {
            return $staticUrl;
        }

        Log::error('No reachable PDF URL for WhatsApp', [
            'request' => $request->reference_number,
        ]);

        return null;
    }

    public function getPublicUrl(ServiceRequest $request): ?string
    {
        if (! $request->pdf_path || ! Storage::disk('public')->exists($request->pdf_path)) {
            return null;
        }

        $static = $this->publishToWebRoot($request);

        return $static ?: Storage::disk('public')->url($request->pdf_path);
    }

    public function generateInvoice(\App\Models\Invoice $invoice): string
    {
        $invoice->load(['serviceRequest.items', 'serviceRequest.documents', 'payments']);
        $request = $invoice->serviceRequest;
        $settings = app(SiteSettingsService::class)->branding();
        $qr = app(QrCodeService::class)->pngDataUri(
            app(QrCodeService::class)->trackUrl($request->tracking_token)
        );

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'request' => $request,
            'companyName' => $settings['company_name'],
            'companyPhone' => $settings['company_phone'],
            'companyLocation' => $settings['company_location'],
            'headerHtml' => $settings['pdf_header_html'],
            'footerHtml' => $settings['pdf_footer_html'],
            'logoUrl' => $settings['logo_url'],
            'qrDataUri' => $qr,
        ])->setPaper('a4');

        $path = "invoices/{$invoice->invoice_number}.pdf";
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateStaffCopy(ServiceRequest $request): string
    {
        $request->load(['items', 'documents']);
        $settings = app(SiteSettingsService::class)->branding();
        $qr = app(QrCodeService::class)->pngDataUri(
            app(QrCodeService::class)->trackUrl($request->tracking_token)
        );

        $pdf = Pdf::loadView('pdf.request', [
            'request' => $request,
            'signatureData' => null,
            'companyName' => $settings['company_name'],
            'companyPhone' => $settings['company_phone'],
            'companyLocation' => $settings['company_location'],
            'headerHtml' => $settings['pdf_header_html'],
            'footerHtml' => $settings['pdf_footer_html'],
            'logoUrl' => $settings['logo_url'],
            'qrDataUri' => $qr,
            'hideAmounts' => true,
            'showAgreement' => false,
            'agreementHtml' => '',
        ])->setPaper('a4');

        $path = "requests/{$request->reference_number}-staff.pdf";
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function publishToWebRoot(ServiceRequest $request): ?string
    {
        if (! $request->pdf_path || ! Storage::disk('public')->exists($request->pdf_path)) {
            return null;
        }

        $webRoot = config('ips.public_web_root');
        if (! $webRoot || ! is_dir($webRoot)) {
            return null;
        }

        $destDir = rtrim($webRoot, '/').'/media/requests';
        if (! is_dir($destDir) && ! @mkdir($destDir, 0755, true) && ! is_dir($destDir)) {
            Log::warning('Could not create media/requests directory', ['path' => $destDir]);

            return null;
        }

        $fileName = $request->reference_number.'.pdf';
        $destPath = $destDir.'/'.$fileName;
        $sourcePath = Storage::disk('public')->path($request->pdf_path);

        if (! @copy($sourcePath, $destPath)) {
            Log::warning('Could not copy PDF to public web root', [
                'from' => $sourcePath,
                'to' => $destPath,
            ]);

            return null;
        }

        return rtrim(config('app.frontend_url', config('app.url')), '/').'/media/requests/'.$fileName;
    }

    private function urlIsReachable(string $url): bool
    {
        try {
            $response = Http::timeout(15)->head($url);

            return $response->successful();
        } catch (\Throwable $e) {
            return false;
        }
    }
}
