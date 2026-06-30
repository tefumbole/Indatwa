<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestItem;
use App\Models\StaffTask;
use App\Models\User;
use App\Services\Notifications\TaskNotificationService;
use App\Services\RequestPdfService;
use App\Services\Wasender\WasenderWhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AdminTaskController extends Controller
{
    private TaskNotificationService $notifications;

    public function __construct(TaskNotificationService $notifications)
    {
        $this->notifications = $notifications;
    }

    public function index(Request $request): JsonResponse
    {
        $query = StaffTask::with([
            'assignee:id,name,email',
            'creator:id,name',
            'serviceRequest:id,reference_number,client_name,event_title',
        ])->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($assignedTo = $request->query('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }

        $tasks = $query->get()->map(fn (StaffTask $task) => $this->formatTask($task));

        return response()->json(['success' => true, 'data' => $tasks]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'assigned_to' => 'nullable|exists:users,id',
            'service_request_id' => 'nullable|exists:service_requests,id',
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high'])],
            'due_date' => 'nullable|date',
        ]);

        $task = StaffTask::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'service_request_id' => $validated['service_request_id'] ?? null,
            'priority' => $validated['priority'] ?? 'normal',
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        $task->load([
            'assignee:id,name,email,phone',
            'creator:id,name',
            'serviceRequest:id,reference_number,client_name,event_title',
        ]);

        if ($task->assigned_to) {
            try {
                $this->notifications->notifyAssigned($task);
            } catch (\Throwable $e) {
                Log::error('Task assign WhatsApp failed: '.$e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $task = StaffTask::findOrFail($id);
        $previousStatus = $task->status;
        $previousAssignee = $task->assigned_to;

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:5000',
            'assigned_to' => 'nullable|exists:users,id',
            'service_request_id' => 'nullable|exists:service_requests,id',
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high'])],
            'due_date' => 'nullable|date',
        ]);

        if (($validated['status'] ?? null) === 'completed' && ! $task->completed_at) {
            $validated['completed_at'] = now();
        }

        $task->update($validated);
        $task->refresh()->load([
            'assignee:id,name,email,phone',
            'creator:id,name',
            'serviceRequest:id,reference_number,client_name,event_title',
        ]);

        try {
            if (isset($validated['assigned_to']) && $validated['assigned_to'] != $previousAssignee) {
                $this->notifications->notifyAssigned($task);
            } elseif (isset($validated['status']) && $validated['status'] !== $previousStatus) {
                $this->notifications->notifyStatusChange($task, $previousStatus);
            }
        } catch (\Throwable $e) {
            Log::error('Task update WhatsApp failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
        ]);
    }

    public function assignableRequests(): JsonResponse
    {
        $requests = ServiceRequest::with('items')
            ->whereNotNull('client_signed_at')
            ->whereIn('status', ['awaiting_payment', 'approved', 'in_progress'])
            ->orderByDesc('client_signed_at')
            ->get()
            ->map(fn (ServiceRequest $r) => [
                'id' => $r->id,
                'reference_number' => $r->reference_number,
                'client_name' => $r->client_name,
                'event_title' => $r->event_title,
                'services' => $r->items
                    ->where('status', 'approved')
                    ->where('client_status', 'accepted')
                    ->map(fn ($i) => ['id' => $i->id, 'name' => $i->service_name])
                    ->values(),
            ])
            ->filter(fn ($r) => count($r['services']) > 0)
            ->values();

        return response()->json(['success' => true, 'data' => $requests]);
    }

    public function assignFromRequest(Request $request, RequestPdfService $pdfService, WasenderWhatsAppService $wasender): JsonResponse
    {
        $validated = $request->validate([
            'service_request_id' => 'required|exists:service_requests,id',
            'assigned_to' => 'required|exists:users,id',
            'service_item_ids' => 'required|array|min:1',
            'service_item_ids.*' => 'integer',
            'notes' => 'nullable|string|max:5000',
            'due_date' => 'nullable|date',
        ]);

        $serviceRequest = ServiceRequest::with('items')->findOrFail($validated['service_request_id']);
        $items = $serviceRequest->items
            ->whereIn('id', $validated['service_item_ids'])
            ->where('status', 'approved')
            ->where('client_status', 'accepted');

        if ($items->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No valid client-approved services selected'], 422);
        }

        $serviceNames = $items->pluck('service_name')->join(', ');
        $task = StaffTask::create([
            'title' => "{$serviceRequest->reference_number} — {$serviceNames}",
            'description' => $validated['notes'] ?? "Assignment for {$serviceRequest->event_title}",
            'assigned_to' => $validated['assigned_to'],
            'service_request_id' => $serviceRequest->id,
            'assigned_service_item_ids' => $items->pluck('id')->values()->all(),
            'hide_amounts' => true,
            'priority' => 'normal',
            'due_date' => $validated['due_date'] ?? $serviceRequest->event_date,
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        $task->load(['assignee:id,name,email,phone', 'creator:id,name', 'serviceRequest']);

        try {
            $this->notifications->notifyAssigned($task);
            $staffPath = $pdfService->generateStaffCopy($serviceRequest);
            if ($task->assignee && $task->assignee->phone && $wasender->isConfigured()) {
                $pdfContent = \Illuminate\Support\Facades\Storage::disk('public')->get($staffPath);
                $upload = $wasender->uploadBuffer($pdfContent, 'application/pdf', $serviceRequest->reference_number.'-task.pdf');
                if ($upload['success'] && $upload['public_url']) {
                    app(\App\Services\WhatsApp\WhatsAppService::class)->sendDocument(
                        \App\Support\PhoneFormatter::toE164($task->assignee->phone),
                        $upload['public_url'],
                        'Task brief — '.$serviceRequest->reference_number
                    );
                }
            }
        } catch (\Throwable $e) {
            Log::error('Task assign from request failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        StaffTask::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Task removed.']);
    }

    public function myTasks(Request $request): JsonResponse
    {
        $tasks = StaffTask::with([
            'creator:id,name',
            'serviceRequest:id,reference_number,client_name,event_title',
        ])
            ->where('assigned_to', $request->user()->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderBy('due_date')
            ->get()
            ->map(fn (StaffTask $task) => $this->formatTask($task));

        return response()->json(['success' => true, 'data' => $tasks]);
    }

    private function formatTask(StaffTask $task): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'priority' => $task->priority,
            'due_date' => $task->due_date?->format('Y-m-d'),
            'completed_at' => $task->completed_at?->toIso8601String(),
            'assignment_notified_at' => $task->assignment_notified_at?->toIso8601String(),
            'last_reminder_at' => $task->last_reminder_at?->toIso8601String(),
            'created_at' => $task->created_at?->toIso8601String(),
            'assigned_to' => $task->assignee ? [
                'id' => $task->assignee->id,
                'name' => $task->assignee->name,
                'email' => $task->assignee->email,
            ] : null,
            'created_by' => $task->creator ? [
                'id' => $task->creator->id,
                'name' => $task->creator->name,
            ] : null,
            'service_request' => $task->serviceRequest ? [
                'id' => $task->serviceRequest->id,
                'reference_number' => $task->serviceRequest->reference_number,
                'client_name' => $task->serviceRequest->client_name,
                'event_title' => $task->serviceRequest->event_title,
            ] : null,
        ];
    }
}
