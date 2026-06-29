<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffTask;
use App\Models\User;
use App\Services\Notifications\TaskNotificationService;
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
