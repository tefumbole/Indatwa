<?php

namespace App\Services;

use App\Models\ServiceRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class RequestPdfService
{
    public function generate(ServiceRequest $request): string
    {
        $request->load(['items', 'documents']);

        $signatureData = null;
        if ($request->signature_path && Storage::disk('local')->exists($request->signature_path)) {
            $signatureData = base64_encode(Storage::disk('local')->get($request->signature_path));
        }

        $pdf = Pdf::loadView('pdf.request', [
            'request' => $request,
            'signatureData' => $signatureData,
            'companyName' => config('ips.company_name'),
            'companyPhone' => config('ips.company_phone'),
            'companyLocation' => config('ips.company_location'),
        ])->setPaper('a4');

        $path = "requests/{$request->reference_number}.pdf";
        Storage::disk('public')->put($path, $pdf->output());

        $request->update(['pdf_path' => $path]);

        return $path;
    }

    public function getPublicUrl(ServiceRequest $request): ?string
    {
        if (! $request->pdf_path || ! Storage::disk('public')->exists($request->pdf_path)) {
            return null;
        }

        return Storage::disk('public')->url($request->pdf_path);
    }
}
