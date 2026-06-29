<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestItem;
use App\Models\User;
use App\Services\Notifications\RequestNotificationService;
use App\Services\RequestPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminRequestController extends Controller
{
    private $pdfService;
    private $notifications;

    public function __construct(RequestPdfService $pdfService, RequestNotificationService $notifications)
    {
        $this->pdfService = $pdfService;
        $this->notifications = $notifications;
    }

    public function index(Request $request): JsonResponse
    {
        $query = ServiceRequest::withCount('items')->orderByDesc('submitted_at');

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
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);
        $item = ServiceRequestItem::where('service_request_id', $serviceRequest->id)
            ->where('id', $itemId)
            ->firstOrFail();

        $item->update([
            'status' => $validated['status'],
            'admin_comment' => $validated['admin_comment'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

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

    public function setQuotation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quoted_amount' => 'required|numeric|min:0',
            'quotation_notes' => 'nullable|string|max:5000',
            'send_to_client' => 'nullable|boolean',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($id);
        $fromStatus = $serviceRequest->status;

        $serviceRequest->update([
            'quoted_amount' => $validated['quoted_amount'],
            'quotation_notes' => $validated['quotation_notes'] ?? null,
            'quotation_sent_at' => ! empty($validated['send_to_client']) ? now() : $serviceRequest->quotation_sent_at,
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
                'total_amount' => $validated['quoted_amount'],
                'amount_paid' => 0,
                'currency' => 'RWF',
                'status' => 'sent',
                'sent_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        if (! empty($validated['send_to_client'])) {
            try {
                $this->notifications->sendQuotation(
                    $serviceRequest->fresh(),
                    (float) $validated['quoted_amount'],
                    $validated['quotation_notes'] ?? null
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Quotation WhatsApp failed: '.$e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'quoted_amount' => $serviceRequest->quoted_amount,
                'status' => $serviceRequest->status,
                'invoice_number' => $invoiceNumber,
            ],
        ]);
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
        ];
    }
}
