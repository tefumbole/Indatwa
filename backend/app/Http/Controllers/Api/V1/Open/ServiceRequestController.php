<?php

namespace App\Http\Controllers\Api\V1\Open;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Services\ClientAccountService;
use App\Services\Notifications\RequestNotificationService;
use App\Services\ReferenceNumberService;
use App\Services\RequestPdfService;
use App\Services\SiteSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ServiceRequestController extends Controller
{
    private $referenceNumbers;
    private $pdfService;

    public function __construct(ReferenceNumberService $referenceNumbers, RequestPdfService $pdfService)
    {
        $this->referenceNumbers = $referenceNumbers;
        $this->pdfService = $pdfService;
    }

    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'services' => 'required|array|min:1',
            'services.*' => 'integer|exists:services,id',
            'client_name' => 'required|string|max:255',
            'client_phone' => 'required|string|max:20',
            'client_email' => 'nullable|email|max:255',
            'client_nationality' => 'nullable|string|max:100',
            'client_country' => 'nullable|string|max:100',
            'client_city' => 'nullable|string|max:100',
            'event_title' => 'required|string|max:255',
            'event_type' => 'required|string|max:100',
            'event_date' => 'nullable|date',
            'event_start_date' => 'required|date',
            'event_end_date' => 'nullable|date|after_or_equal:event_start_date',
            'event_start_time' => 'nullable|date_format:H:i',
            'event_end_time' => 'nullable|date_format:H:i',
            'number_of_guests' => 'nullable|integer|min:1',
            'venue' => 'nullable|string|max:500',
            'event_description' => 'nullable|string|max:5000',
            'signature' => 'nullable|string',
            'documents' => 'nullable|array|max:5',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
            'document_types' => 'nullable|array',
            'document_types.*' => 'in:passport,national_id,other_identification',
        ]);

        if (empty($validated['event_date'])) {
            $validated['event_date'] = $validated['event_start_date'];
        }

        $serviceRequest = DB::transaction(function () use ($validated, $request) {
            $reference = $this->referenceNumbers->generate('request', 'IPS');
            $trackingToken = Str::random(64);
            $signaturePath = ! empty($validated['signature'])
                ? $this->storeSignature($validated['signature'], $reference)
                : null;

            $serviceRequest = ServiceRequest::create([
                ...collect($validated)->except(['services', 'signature', 'documents', 'document_types'])->toArray(),
                'user_id' => $request->user() ? $request->user()->id : null,
                'reference_number' => $reference,
                'tracking_token' => $trackingToken,
                'signature_path' => $signaturePath,
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            $services = Service::whereIn('id', $validated['services'])->get();
            foreach ($services as $service) {
                $serviceRequest->items()->create([
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'status' => 'pending',
                ]);
            }

            $this->storeDocuments($request, $serviceRequest, $reference);

            DB::table('service_request_status_history')->insert([
                'service_request_id' => $serviceRequest->id,
                'from_status' => null,
                'to_status' => 'submitted',
                'created_at' => now(),
            ]);

            return $serviceRequest->load(['items', 'documents']);
        });

        $requestId = $serviceRequest->id;
        $trackingUrl = config('app.frontend_url').'/track/'.$serviceRequest->tracking_token;

        app()->terminating(function () use ($requestId) {
            $fresh = ServiceRequest::with(['items', 'documents'])->find($requestId);
            if (! $fresh) {
                return;
            }

            try {
                app(ClientAccountService::class)->ensureForRequest($fresh);
            } catch (\Throwable $e) {
                Log::error('Client account creation failed: '.$e->getMessage());
            }

            try {
                app(RequestPdfService::class)->generate($fresh->fresh());
            } catch (\Throwable $e) {
                Log::error('Request PDF generation failed: '.$e->getMessage());
            }

            try {
                app(RequestNotificationService::class)
                    ->sendSubmitted($fresh->fresh(['items', 'documents']));
            } catch (\Throwable $e) {
                Log::error('Request notification failed: '.$e->getMessage());
            }
        });

        return response()->json([
            'success' => true,
            'data' => [
                'reference_number' => $serviceRequest->reference_number,
                'tracking_token' => $serviceRequest->tracking_token,
                'tracking_url' => $trackingUrl,
                'pdf_url' => null,
                'status' => $serviceRequest->status,
            ],
        ], 201);
    }

    public function track(string $token): JsonResponse
    {
        $request = ServiceRequest::where('tracking_token', $token)
            ->with(['items.service', 'documents'])
            ->firstOrFail();

        $settings = app(SiteSettingsService::class)->branding();
        $approvedItems = $request->items->where('status', 'approved');

        return response()->json([
            'success' => true,
            'data' => [
                'reference_number' => $request->reference_number,
                'status' => $request->status,
                'client_name' => $request->client_name,
                'client_phone' => $request->client_phone,
                'client_email' => $request->client_email,
                'client_nationality' => $request->client_nationality,
                'client_country' => $request->client_country,
                'client_city' => $request->client_city,
                'event_title' => $request->event_title,
                'event_date' => $request->event_date->format('Y-m-d'),
                'event_type' => $request->event_type,
                'venue' => $request->venue,
                'event_description' => $request->event_description,
                'services' => $request->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->service_name,
                    'status' => $item->status,
                    'client_status' => $item->client_status ?? 'pending',
                    'quoted_price' => $item->status === 'approved' ? $item->quoted_price : null,
                ]),
                'quoted_amount' => $request->quoted_amount,
                'miscellaneous_amount' => $request->miscellaneous_amount,
                'quotation_notes' => $request->quotation_notes,
                'sent_for_signature_at' => $request->sent_for_signature_at
                    ? $request->sent_for_signature_at->toIso8601String() : null,
                'client_signed_at' => $request->client_signed_at
                    ? $request->client_signed_at->toIso8601String() : null,
                'agreement_accepted' => (bool) $request->agreement_accepted,
                'can_accept_quotation' => $request->status === 'quotation_prepared'
                    && $request->sent_for_signature_at
                    && ! $request->client_signed_at,
                'documents_count' => $request->documents->count(),
                'has_id_document' => $request->documents->contains(fn ($d) => in_array($d->document_type, ['passport', 'national_id'], true)),
                'pdf_url' => $this->pdfService->getPublicUrl($request),
                'submitted_at' => $request->submitted_at->toIso8601String(),
                'branding' => [
                    'company_name' => $settings['company_name'],
                    'company_phone' => $settings['company_phone'],
                    'company_location' => $settings['company_location'],
                    'logo_url' => $settings['logo_url'],
                ],
                'rental_agreement_html' => $settings['rental_agreement_html'],
                'accepted_services_total' => $approvedItems->where('client_status', 'accepted')->sum('quoted_price'),
            ],
        ]);
    }

    public function acceptQuotation(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'signature' => 'required|string',
            'agreement_accepted' => 'required|accepted',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.client_status' => 'required|in:accepted,rejected',
            'id_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'id_document_type' => 'nullable|in:passport,national_id',
        ]);

        $serviceRequest = ServiceRequest::where('tracking_token', $token)
            ->with('items')
            ->firstOrFail();

        if ($serviceRequest->client_signed_at) {
            return response()->json(['success' => false, 'message' => 'Quotation already accepted'], 422);
        }

        if ($serviceRequest->status !== 'quotation_prepared' || ! $serviceRequest->sent_for_signature_at) {
            return response()->json(['success' => false, 'message' => 'Quotation is not available for acceptance'], 422);
        }

        $approvedIds = $serviceRequest->items->where('status', 'approved')->pluck('id')->all();
        $submittedIds = collect($validated['items'])->pluck('id')->all();

        if (count(array_diff($approvedIds, $submittedIds)) > 0) {
            return response()->json(['success' => false, 'message' => 'Please respond to all quoted services'], 422);
        }

        $acceptedCount = 0;
        foreach ($validated['items'] as $row) {
            $item = $serviceRequest->items->firstWhere('id', $row['id']);
            if (! $item || $item->status !== 'approved') {
                return response()->json(['success' => false, 'message' => 'Invalid service item'], 422);
            }
            $item->update([
                'client_status' => $row['client_status'],
                'client_responded_at' => now(),
            ]);
            if ($row['client_status'] === 'accepted') {
                $acceptedCount++;
            }
        }

        if ($acceptedCount === 0) {
            return response()->json(['success' => false, 'message' => 'You must accept at least one service'], 422);
        }

        if ($request->hasFile('id_document')) {
            $this->storeIdDocument($request, $serviceRequest);
        } elseif (! $serviceRequest->documents()->whereIn('document_type', ['passport', 'national_id'])->exists()) {
            return response()->json(['success' => false, 'message' => 'ID or passport document is required'], 422);
        }

        $signaturePath = $this->storeSignature($validated['signature'], $serviceRequest->reference_number);
        if (! $signaturePath) {
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 422);
        }

        $serviceRequest->load('items');
        $acceptedTotal = $serviceRequest->items
            ->where('status', 'approved')
            ->where('client_status', 'accepted')
            ->sum('quoted_price');
        $misc = (float) ($serviceRequest->miscellaneous_amount ?? 0);
        $finalTotal = $acceptedTotal + $misc;

        $fromStatus = $serviceRequest->status;
        $serviceRequest->update([
            'signature_path' => $signaturePath,
            'client_signed_at' => now(),
            'agreement_accepted' => true,
            'agreement_accepted_at' => now(),
            'quoted_amount' => $finalTotal,
            'status' => 'awaiting_payment',
        ]);

        DB::table('service_request_status_history')->insert([
            'service_request_id' => $serviceRequest->id,
            'from_status' => $fromStatus,
            'to_status' => 'awaiting_payment',
            'comment' => 'Client accepted quotation, signed agreement, and selected services',
            'created_at' => now(),
        ]);

        DB::table('invoices')->updateOrInsert(
            ['service_request_id' => $serviceRequest->id],
            [
                'invoice_number' => 'INV-'.$serviceRequest->reference_number,
                'total_amount' => $finalTotal,
                'amount_paid' => 0,
                'currency' => 'RWF',
                'status' => 'sent',
                'sent_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        try {
            $this->pdfService->generate($serviceRequest->fresh());
        } catch (\Throwable $e) {
            Log::error('Confirmed PDF generation failed: '.$e->getMessage());
        }

        try {
            app(RequestNotificationService::class)->sendClientConfirmed($serviceRequest->fresh());
        } catch (\Throwable $e) {
            Log::error('Client confirmation notification failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $serviceRequest->status,
                'client_signed_at' => $serviceRequest->client_signed_at->toIso8601String(),
                'quoted_amount' => $serviceRequest->quoted_amount,
                'pdf_url' => $this->pdfService->getPublicUrl($serviceRequest->fresh()),
            ],
        ]);
    }

    public function downloadPdf(string $token)
    {
        $request = ServiceRequest::where('tracking_token', $token)->firstOrFail();

        if (! $request->pdf_path || ! Storage::disk('public')->exists($request->pdf_path)) {
            $this->pdfService->generate($request);
            $request->refresh();
        }

        if (! $request->pdf_path || ! Storage::disk('public')->exists($request->pdf_path)) {
            return response()->json(['success' => false, 'message' => 'PDF not available'], 404);
        }

        return response()->download(
            Storage::disk('public')->path($request->pdf_path),
            "{$request->reference_number}.pdf"
        );
    }

    private function storeSignature(string $base64, string $reference): ?string
    {
        $data = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
        $decoded = base64_decode($data, true);
        if ($decoded === false || strlen($decoded) < 100) {
            return null;
        }
        $path = "signatures/{$reference}.png";
        Storage::disk('local')->put($path, $decoded);

        return $path;
    }

    private function storeDocuments(Request $request, ServiceRequest $serviceRequest, string $reference): void
    {
        if (! $request->hasFile('documents')) {
            return;
        }

        $types = $request->input('document_types', []);
        foreach ($request->file('documents') as $index => $file) {
            $type = $types[$index] ?? 'other_identification';
            $this->saveDocumentFile($serviceRequest, $reference, $file, $type);
        }
    }

    private function storeIdDocument(Request $request, ServiceRequest $serviceRequest): void
    {
        $file = $request->file('id_document');
        if (! $file) {
            return;
        }

        $type = $request->input('id_document_type', 'national_id');
        $this->saveDocumentFile($serviceRequest, $serviceRequest->reference_number, $file, $type);
    }

    private function saveDocumentFile(ServiceRequest $serviceRequest, string $reference, $file, string $type): void
    {
        $filename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'_'.time().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs("requests/{$reference}/documents", $filename, 'local');

        $serviceRequest->documents()->create([
            'document_type' => $type,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }
}
