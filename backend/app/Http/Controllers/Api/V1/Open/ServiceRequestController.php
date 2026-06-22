<?php

namespace App\Http\Controllers\Api\V1\Open;

use App\Http\Controllers\Controller;
use App\Jobs\SendRequestSubmittedNotifications;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Services\ReferenceNumberService;
use App\Services\RequestPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'event_date' => 'required|date',
            'event_start_date' => 'nullable|date',
            'event_end_date' => 'nullable|date|after_or_equal:event_start_date',
            'number_of_guests' => 'nullable|integer|min:1',
            'venue' => 'nullable|string|max:500',
            'event_description' => 'nullable|string|max:5000',
            'signature' => 'required|string',
            'documents' => 'nullable|array|max:5',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
            'document_types' => 'nullable|array',
            'document_types.*' => 'in:passport,national_id,other_identification',
        ]);

        $serviceRequest = DB::transaction(function () use ($validated, $request) {
            $reference = $this->referenceNumbers->generate('request', 'IPS');
            $trackingToken = Str::random(64);
            $signaturePath = $this->storeSignature($validated['signature'], $reference);

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

        $this->pdfService->generate($serviceRequest);
        $pdfUrl = $this->pdfService->getPublicUrl($serviceRequest->fresh());

        SendRequestSubmittedNotifications::dispatch($serviceRequest->id);

        return response()->json([
            'success' => true,
            'data' => [
                'reference_number' => $serviceRequest->reference_number,
                'tracking_token' => $serviceRequest->tracking_token,
                'tracking_url' => config('app.frontend_url').'/track/'.$serviceRequest->tracking_token,
                'pdf_url' => $pdfUrl,
                'status' => $serviceRequest->status,
            ],
        ], 201);
    }

    public function track(string $token): JsonResponse
    {
        $request = ServiceRequest::where('tracking_token', $token)
            ->with(['items.service', 'documents'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'reference_number' => $request->reference_number,
                'status' => $request->status,
                'client_name' => $request->client_name,
                'event_title' => $request->event_title,
                'event_date' => $request->event_date->format('Y-m-d'),
                'event_type' => $request->event_type,
                'venue' => $request->venue,
                'services' => $request->items->map(fn ($item) => [
                    'name' => $item->service_name,
                    'status' => $item->status,
                ]),
                'documents_count' => $request->documents->count(),
                'pdf_url' => $this->pdfService->getPublicUrl($request),
                'submitted_at' => $request->submitted_at->toIso8601String(),
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

    private function storeSignature(string $base64, string $reference): string
    {
        $data = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
        $decoded = base64_decode($data);
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
}
