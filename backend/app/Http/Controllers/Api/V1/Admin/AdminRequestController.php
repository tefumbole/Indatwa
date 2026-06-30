<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarDate;
use App\Models\ServiceAssignment;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestItem;
use App\Models\User;
use App\Services\ClientAccountService;
use App\Services\Notifications\RequestNotificationService;
use App\Services\ReferenceNumberService;
use App\Services\RequestPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminRequestController extends Controller
{
    private $pdfService;
    private $notifications;
    private $referenceNumbers;

    private $clientAccounts;

    public function __construct(
        RequestPdfService $pdfService,
        RequestNotificationService $notifications,
        ReferenceNumberService $referenceNumbers,
        ClientAccountService $clientAccounts
    ) {
        $this->pdfService = $pdfService;
        $this->notifications = $notifications;
        $this->referenceNumbers = $referenceNumbers;
        $this->clientAccounts = $clientAccounts;
    }

    public function index(Request $request): JsonResponse
    {
        $query = ServiceRequest::withCount('items')->orderByDesc('submitted_at');

        if ($tab = $request->query('tab')) {
            $this->applyTabFilter($query, $tab);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('client_name', 'like', "%{$search}%")
                    ->orWhere('event_title', 'like', "%{$search}%")
                    ->orWhere('client_phone', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate((int) $request->query('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => collect($paginated->items())->map(function ($r) {
                return $this->summary($r);
            }),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $serviceRequest = ServiceRequest::with(['items', 'documents', 'user:id,name,phone,email'])
            ->findOrFail($id);

        $history = DB::table('service_request_status_history')
            ->where('service_request_id', $serviceRequest->id)
            ->orderBy('created_at')
            ->get();

        $messages = $serviceRequest->messages()
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->get();

        $assignee = $serviceRequest->assigned_to
            ? User::select('id', 'name', 'email')->find($serviceRequest->assigned_to)
            : null;

        return response()->json([
            'success' => true,
            'data' => array_merge($this->summary($serviceRequest), [
                'client_email' => $serviceRequest->client_email,
                'client_phone' => $serviceRequest->client_phone,
                'client_nationality' => $serviceRequest->client_nationality,
                'client_country' => $serviceRequest->client_country,
                'client_city' => $serviceRequest->client_city,
                'event_description' => $serviceRequest->event_description,
                'venue' => $serviceRequest->venue,
                'number_of_guests' => $serviceRequest->number_of_guests,
                'event_start_date' => $serviceRequest->event_start_date
                    ? $serviceRequest->event_start_date->format('Y-m-d') : null,
                'event_end_date' => $serviceRequest->event_end_date
                    ? $serviceRequest->event_end_date->format('Y-m-d') : null,
                'admin_notes' => $serviceRequest->admin_notes,
                'client_notes' => $serviceRequest->client_notes,
                'assigned_to' => $assignee,
                'user' => $serviceRequest->user,
                'services' => $serviceRequest->items->map(function ($i) {
                    return [
                        'id' => $i->id,
                        'name' => $i->service_name,
                        'status' => $i->status,
                        'client_status' => $i->client_status ?? 'pending',
                        'quoted_price' => $i->quoted_price,
                        'admin_comment' => $i->admin_comment,
                        'reviewed_at' => $i->reviewed_at,
                    ];
                }),
                'documents' => $serviceRequest->documents->map(function ($d) {
                    return [
                        'id' => $d->id,
                        'type' => $d->document_type,
                        'name' => $d->original_name,
                        'uploaded_at' => $d->created_at,
                    ];
                }),
                'status_history' => $history,
                'messages' => $messages,
                'pdf_url' => $this->pdfService->getPublicUrl($serviceRequest),
                'tracking_url' => config('app.frontend_url').'/track/'.$serviceRequest->tracking_token,
                'quoted_amount' => $serviceRequest->quoted_amount,
                'miscellaneous_amount' => $serviceRequest->miscellaneous_amount,
                'quotation_notes' => $serviceRequest->quotation_notes,
                'sent_for_signature_at' => $serviceRequest->sent_for_signature_at
                    ? $serviceRequest->sent_for_signature_at->toIso8601String() : null,
                'client_signed_at' => $serviceRequest->client_signed_at
                    ? $serviceRequest->client_signed_at->toIso8601String() : null,
                'assignments' => ServiceAssignment::where('service_request_id', $serviceRequest->id)->get(),
            ]),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:submitted,under_review,quotation_prepared,awaiting_payment,approved,in_progress,completed,rejected',
            'note' => 'nullable|string|max:2000',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);
        $fromStatus = $serviceRequest->status;

        $serviceRequest->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        DB::table('service_request_status_history')->insert([
            'service_request_id' => $serviceRequest->id,
            'from_status' => $fromStatus,
            'to_status' => $validated['status'],
            'changed_by' => $request->user()->id,
            'comment' => $validated['note'] ?? null,
            'created_at' => now(),
        ]);

        try {
            $this->notifications->sendStatusUpdate($serviceRequest->fresh(), $validated['note'] ?? null);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Status WhatsApp failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => ['status' => $serviceRequest->status],
        ]);
    }

    public function updateItem(Request $request, int $id, int $itemId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'admin_comment' => 'nullable|string|max:2000',
            'quoted_price' => 'nullable|numeric|min:0',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);
        $item = ServiceRequestItem::where('service_request_id', $serviceRequest->id)
            ->where('id', $itemId)
            ->firstOrFail();

        $item->update([
            'status' => $validated['status'],
            'admin_comment' => $validated['admin_comment'] ?? null,
            'quoted_price' => $validated['quoted_price'] ?? $item->quoted_price,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if (! empty($validated['admin_comment'])) {
            $statusLabel = ucfirst($validated['status']);
            $serviceRequest->messages()->create([
                'sender_id' => $request->user()->id,
                'message' => "Service \"{$item->service_name}\" — {$statusLabel}: {$validated['admin_comment']}",
                'is_internal' => false,
            ]);

            try {
                $this->notifications->sendServiceReviewNote(
                    $serviceRequest->fresh(),
                    $item->fresh(),
                    $validated['status'],
                    $validated['admin_comment']
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Service review WhatsApp failed: '.$e->getMessage());
            }
        }

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function updateNotes(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => 'required|string|max:10000',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);
        $serviceRequest->update(['admin_notes' => $validated['admin_notes']]);

        return response()->json(['success' => true, 'data' => ['admin_notes' => $serviceRequest->admin_notes]]);
    }

    public function assign(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);
        $serviceRequest->update(['assigned_to' => $validated['assigned_to'] ?? null]);

        $assignee = $serviceRequest->assigned_to
            ? User::select('id', 'name', 'phone')->find($serviceRequest->assigned_to)
            : null;

        if ($assignee) {
            try {
                $this->notifications->notifyAssignee($serviceRequest->fresh(), $assignee);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Assign WhatsApp failed: '.$e->getMessage());
            }
        }

        return response()->json(['success' => true, 'data' => ['assigned_to' => $assignee ? ['id' => $assignee->id, 'name' => $assignee->name] : null]]);
    }

    public function addMessage(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
            'is_internal' => 'nullable|boolean',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);

        $msg = $serviceRequest->messages()->create([
            'sender_id' => $request->user()->id,
            'message' => $validated['message'],
            'is_internal' => $validated['is_internal'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $msg->load('sender:id,name'),
        ], 201);
    }

    public function staff(): JsonResponse
    {
        $staff = User::whereHas('roles', function ($q) {
            $q->whereIn('name', [
                'super_admin', 'director', 'operations_manager',
                'protocol_officer', 'customer_service',
            ]);
        })->select('id', 'name', 'email')->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $staff]);
    }

    public function downloadPdf(int $id)
    {
        $serviceRequest = ServiceRequest::findOrFail($id);

        if (! $serviceRequest->pdf_path || ! Storage::disk('public')->exists($serviceRequest->pdf_path)) {
            $this->pdfService->generate($serviceRequest);
            $serviceRequest->refresh();
        }

        return response()->download(
            Storage::disk('public')->path($serviceRequest->pdf_path),
            "{$serviceRequest->reference_number}.pdf"
        );
    }

    public function deleteItems(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'integer',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);

        ServiceRequestItem::where('service_request_id', $serviceRequest->id)
            ->whereIn('id', $validated['item_ids'])
            ->delete();

        return response()->json([
            'success' => true,
            'data' => ['remaining' => $serviceRequest->items()->count()],
        ]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:service_requests,id',
        ]);

        $requests = ServiceRequest::whereIn('id', $validated['ids'])->get();

        foreach ($requests as $serviceRequest) {
            if ($serviceRequest->pdf_path && Storage::disk('public')->exists($serviceRequest->pdf_path)) {
                Storage::disk('public')->delete($serviceRequest->pdf_path);
            }
        }

        $deleted = ServiceRequest::whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'success' => true,
            'data' => ['deleted' => $deleted],
        ]);
    }

    public function setQuotation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quoted_amount' => 'nullable|numeric|min:0',
            'miscellaneous_amount' => 'nullable|numeric|min:0',
            'quotation_notes' => 'nullable|string|max:5000',
            'send_to_client' => 'nullable|boolean',
            'send_for_signature' => 'nullable|boolean',
            'items' => 'nullable|array',
            'items.*.id' => 'required_with:items|integer',
            'items.*.quoted_price' => 'nullable|numeric|min:0',
        ]);

        $serviceRequest = ServiceRequest::with('items')->findOrFail($id);
        $fromStatus = $serviceRequest->status;

        if (! empty($validated['items'])) {
            foreach ($validated['items'] as $row) {
                ServiceRequestItem::where('service_request_id', $serviceRequest->id)
                    ->where('id', $row['id'])
                    ->update(['quoted_price' => $row['quoted_price'] ?? null]);
            }
            $serviceRequest->load('items');
        }

        $misc = (float) ($validated['miscellaneous_amount'] ?? $serviceRequest->miscellaneous_amount ?? 0);
        $itemsTotal = $serviceRequest->items->where('status', 'approved')->sum('quoted_price');
        $total = isset($validated['quoted_amount'])
            ? (float) $validated['quoted_amount']
            : ($itemsTotal + $misc);

        if ($total <= 0 && $serviceRequest->items->where('status', 'approved')->isNotEmpty()) {
            return response()->json(['success' => false, 'message' => 'Quoted amount is required'], 422);
        }

        $sendForSignature = ! empty($validated['send_for_signature']);
        $accessToken = $serviceRequest->quotation_access_token;

        if ($sendForSignature) {
            $this->clientAccounts->ensureForRequest($serviceRequest);
            $accessToken = $this->clientAccounts->issueQuotationToken($serviceRequest->fresh());
            ServiceRequestItem::where('service_request_id', $serviceRequest->id)
                ->where('status', 'approved')
                ->update(['client_status' => 'pending', 'client_responded_at' => null]);
        }

        $serviceRequest->update([
            'quoted_amount' => $total,
            'miscellaneous_amount' => $misc,
            'quotation_notes' => $validated['quotation_notes'] ?? null,
            'quotation_sent_at' => ! empty($validated['send_to_client']) || $sendForSignature ? now() : $serviceRequest->quotation_sent_at,
            'sent_for_signature_at' => $sendForSignature ? now() : $serviceRequest->sent_for_signature_at,
            'status' => 'quotation_prepared',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        DB::table('service_request_status_history')->insert([
            'service_request_id' => $serviceRequest->id,
            'from_status' => $fromStatus,
            'to_status' => 'quotation_prepared',
            'changed_by' => $request->user()->id,
            'comment' => $validated['quotation_notes'] ?? 'Quotation prepared',
            'created_at' => now(),
        ]);

        $invoiceNumber = 'INV-'.$serviceRequest->reference_number;
        DB::table('invoices')->updateOrInsert(
            ['service_request_id' => $serviceRequest->id],
            [
                'invoice_number' => $invoiceNumber,
                'total_amount' => $total,
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
            \Illuminate\Support\Facades\Log::error('Quotation PDF failed: '.$e->getMessage());
        }

        if (! empty($validated['send_to_client']) || $sendForSignature) {
            try {
                $this->notifications->sendQuotation(
                    $serviceRequest->fresh(),
                    (float) $total,
                    $validated['quotation_notes'] ?? null,
                    $accessToken
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Quotation WhatsApp failed: '.$e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'quoted_amount' => $serviceRequest->quoted_amount,
                'miscellaneous_amount' => $serviceRequest->miscellaneous_amount,
                'status' => $serviceRequest->status,
                'invoice_number' => $invoiceNumber,
                'sent_for_signature_at' => $serviceRequest->sent_for_signature_at,
                'quotation_login_url' => $accessToken
                    ? config('app.frontend_url').'/quotation/'.$accessToken
                    : null,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'services' => 'required|array|min:1',
            'services.*' => 'integer|exists:services,id',
            'client_name' => 'required|string|max:255',
            'client_phone' => 'required|string|max:20',
            'client_email' => 'nullable|email',
            'event_title' => 'required|string|max:255',
            'event_type' => 'required|string|max:100',
            'event_date' => 'required|date',
            'venue' => 'nullable|string|max:500',
            'event_description' => 'nullable|string|max:5000',
        ]);

        $reference = $this->referenceNumbers->generate('request', 'IPS');
        $serviceRequest = ServiceRequest::create([
            'reference_number' => $reference,
            'tracking_token' => Str::random(64),
            'status' => 'submitted',
            'client_name' => $validated['client_name'],
            'client_phone' => $validated['client_phone'],
            'client_email' => $validated['client_email'] ?? null,
            'event_title' => $validated['event_title'],
            'event_type' => $validated['event_type'],
            'event_date' => $validated['event_date'],
            'event_start_date' => $validated['event_date'],
            'venue' => $validated['venue'] ?? null,
            'event_description' => $validated['event_description'] ?? null,
            'submitted_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        foreach ($validated['services'] as $serviceId) {
            $service = Service::find($serviceId);
            if ($service) {
                $serviceRequest->items()->create([
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'status' => 'pending',
                ]);
            }
        }

        return response()->json(['success' => true, 'data' => $this->summary($serviceRequest->loadCount('items'))], 201);
    }

    public function acceptAll(int $id, Request $request): JsonResponse
    {
        $serviceRequest = ServiceRequest::with('items')->findOrFail($id);

        foreach ($serviceRequest->items as $item) {
            if ($item->status === 'pending') {
                $item->update([
                    'status' => 'approved',
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now(),
                ]);
            }
        }

        $fromStatus = $serviceRequest->status;
        $serviceRequest->update([
            'status' => 'under_review',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        DB::table('service_request_status_history')->insert([
            'service_request_id' => $serviceRequest->id,
            'from_status' => $fromStatus,
            'to_status' => 'under_review',
            'changed_by' => $request->user()->id,
            'comment' => 'All services accepted by admin',
            'created_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $this->summary($serviceRequest->fresh()->loadCount('items'))]);
    }

    public function assignSchedule(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'assigned_user_ids' => 'required|array|min:1',
            'assigned_user_ids.*' => 'integer|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string|max:2000',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);

        $assignment = ServiceAssignment::create([
            'service_request_id' => $serviceRequest->id,
            'assigned_user_ids' => $validated['assigned_user_ids'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? $validated['start_date'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        CalendarDate::updateOrCreate(
            ['date' => $validated['start_date']],
            [
                'is_booked' => true,
                'service_request_id' => $serviceRequest->id,
                'label' => $serviceRequest->event_title,
                'created_by' => $request->user()->id,
            ]
        );

        if (! empty($validated['end_date']) && $validated['end_date'] !== $validated['start_date']) {
            CalendarDate::updateOrCreate(
                ['date' => $validated['end_date']],
                [
                    'is_booked' => true,
                    'service_request_id' => $serviceRequest->id,
                    'label' => $serviceRequest->event_title,
                    'created_by' => $request->user()->id,
                ]
            );
        }

        return response()->json(['success' => true, 'data' => $assignment]);
    }

    private function applyTabFilter($query, string $tab): void
    {
        switch ($tab) {
            case 'awaiting_quotation':
            case 'awaiting_confirmation':
                $query->whereIn('status', ['submitted', 'under_review'])
                    ->whereHas('items', fn ($q) => $q->where('status', 'pending'));
                break;
            case 'awaiting_client':
                $query->where('status', 'quotation_prepared')
                    ->whereNotNull('sent_for_signature_at')
                    ->whereNull('client_signed_at');
                break;
            case 'confirmed':
                $query->where(function ($q) {
                    $q->whereNotNull('client_signed_at')
                        ->orWhereIn('status', ['approved', 'awaiting_payment', 'in_progress', 'completed']);
                });
                break;
            case 'all':
            default:
                break;
        }
    }

    private function summary(ServiceRequest $r): array
    {
        return [
            'id' => $r->id,
            'reference_number' => $r->reference_number,
            'status' => $r->status,
            'client_name' => $r->client_name,
            'client_phone' => $r->client_phone,
            'event_title' => $r->event_title,
            'event_date' => $r->event_date ? $r->event_date->format('Y-m-d') : null,
            'event_type' => $r->event_type,
            'submitted_at' => $r->submitted_at ? $r->submitted_at->toIso8601String() : null,
            'items_count' => $r->items_count ?? ($r->relationLoaded('items') ? $r->items->count() : 0),
            'assigned_to' => $r->assigned_to,
            'quoted_amount' => $r->quoted_amount,
            'client_signed_at' => $r->client_signed_at ? $r->client_signed_at->toIso8601String() : null,
            'sent_for_signature_at' => $r->sent_for_signature_at ? $r->sent_for_signature_at->toIso8601String() : null,
        ];
    }
}
