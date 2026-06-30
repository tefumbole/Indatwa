<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Services\RequestPdfService;
use App\Support\PhoneFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PortalController extends Controller
{
    private $pdfService;

    public function __construct(RequestPdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function requests(Request $request): JsonResponse
    {
        $user = $request->user();
        $phone = $user->phone;

        $query = ServiceRequest::withCount('items')
            ->where(function ($q) use ($user, $phone) {
                $q->where('user_id', $user->id);
                if ($phone) {
                    $q->orWhere('client_phone', $phone);
                }
            })
            ->orderByDesc('submitted_at');

        $requests = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => collect($requests->items())->map(fn ($r) => $this->summary($r)),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $serviceRequest = $this->findOwnedRequest($request, $id);
        $serviceRequest->load(['items', 'documents']);

        $history = \DB::table('service_request_status_history')
            ->where('service_request_id', $serviceRequest->id)
            ->orderBy('created_at')
            ->get();

        $messages = $serviceRequest->messages()
            ->with('sender:id,name')
            ->where('is_internal', false)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => array_merge($this->summary($serviceRequest), [
                'event_description' => $serviceRequest->event_description,
                'venue' => $serviceRequest->venue,
                'number_of_guests' => $serviceRequest->number_of_guests,
                'services' => $serviceRequest->items->map(fn ($i) => [
                    'id' => $i->id,
                    'name' => $i->service_name,
                    'status' => $i->status,
                    'client_status' => $i->client_status ?? 'pending',
                    'quoted_price' => $i->status === 'approved' ? $i->quoted_price : null,
                    'admin_comment' => $i->admin_comment,
                ]),
                'quoted_amount' => $serviceRequest->quoted_amount,
                'miscellaneous_amount' => $serviceRequest->miscellaneous_amount,
                'quotation_notes' => $serviceRequest->quotation_notes,
                'client_name' => $serviceRequest->client_name,
                'client_phone' => $serviceRequest->client_phone,
                'can_accept_quotation' => $serviceRequest->status === 'quotation_prepared'
                    && $serviceRequest->sent_for_signature_at
                    && ! $serviceRequest->client_signed_at,
                'sent_for_signature_at' => $serviceRequest->sent_for_signature_at
                    ? $serviceRequest->sent_for_signature_at->toIso8601String() : null,
                'tracking_token' => $serviceRequest->tracking_token,
                'documents' => $serviceRequest->documents->map(fn ($d) => [
                    'id' => $d->id,
                    'type' => $d->document_type,
                    'name' => $d->original_name,
                    'uploaded_at' => $d->created_at,
                ]),
                'status_history' => $history,
                'messages' => $messages,
                'pdf_url' => $this->pdfService->getPublicUrl($serviceRequest),
                'tracking_url' => config('app.frontend_url').'/track/'.$serviceRequest->tracking_token,
            ]),
        ]);
    }

    public function downloadPdf(Request $request, int $id)
    {
        $serviceRequest = $this->findOwnedRequest($request, $id);

        if (! $serviceRequest->pdf_path || ! Storage::disk('public')->exists($serviceRequest->pdf_path)) {
            $this->pdfService->generate($serviceRequest);
            $serviceRequest->refresh();
        }

        return response()->download(
            Storage::disk('public')->path($serviceRequest->pdf_path),
            "{$serviceRequest->reference_number}.pdf"
        );
    }

    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $serviceRequest = $this->findOwnedRequest($request, $id);

        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'document_type' => 'nullable|in:passport,national_id,other_identification,additional',
        ]);

        $file = $validated['document'];
        $filename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'_'.time().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs("requests/{$serviceRequest->reference_number}/documents", $filename, 'local');

        $doc = $serviceRequest->documents()->create([
            'document_type' => $validated['document_type'] ?? 'additional',
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['success' => true, 'data' => $doc], 201);
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $serviceRequest = $this->findOwnedRequest($request, $id);

        if ($request->isMethod('post')) {
            $validated = $request->validate(['message' => 'required|string|max:5000']);

            $msg = $serviceRequest->messages()->create([
                'sender_id' => $request->user()->id,
                'message' => $validated['message'],
                'is_internal' => false,
            ]);

            return response()->json(['success' => true, 'data' => $msg->load('sender:id,name')], 201);
        }

        $messages = $serviceRequest->messages()
            ->with('sender:id,name')
            ->where('is_internal', false)
            ->orderBy('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function initiatePayment(Request $request, int $id): JsonResponse
    {
        $serviceRequest = $this->findOwnedRequest($request, $id);

        if (! in_array($serviceRequest->status, ['quotation_prepared', 'awaiting_payment'])) {
            return response()->json(['success' => false, 'message' => 'Payment not available for this request'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment integration coming in Phase 7',
            'data' => [
                'request_id' => $serviceRequest->id,
                'reference_number' => $serviceRequest->reference_number,
                'status' => 'pending',
                'methods' => ['mtn_momo', 'airtel_money', 'flutterwave_card'],
            ],
        ]);
    }

    private function findOwnedRequest(Request $request, int $id): ServiceRequest
    {
        $user = $request->user();
        $phone = PhoneFormatter::toE164($user->phone ?? '');

        return ServiceRequest::where('id', $id)
            ->where(function ($q) use ($user, $phone) {
                $q->where('user_id', $user->id);
                if ($phone) {
                    $q->orWhere('client_phone', $phone);
                }
            })
            ->firstOrFail();
    }

    private function summary(ServiceRequest $r): array
    {
        return [
            'id' => $r->id,
            'reference_number' => $r->reference_number,
            'status' => $r->status,
            'event_title' => $r->event_title,
            'event_date' => $r->event_date->format('Y-m-d'),
            'event_type' => $r->event_type,
            'submitted_at' => $r->submitted_at->toIso8601String(),
            'items_count' => $r->items_count ?? $r->items->count(),
        ];
    }
}
