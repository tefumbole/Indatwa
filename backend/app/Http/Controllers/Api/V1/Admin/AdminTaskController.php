<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffTask;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminTaskController extends Controller
{
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

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task->load([
                'assignee:id,name,email',
                'creator:id,name',
                'serviceRequest:id,reference_number,client_name,event_title',
            ])),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $task = StaffTask::findOrFail($id);

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

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task->fresh()->load([
                'assignee:id,name,email',
                'creator:id,name',
                'serviceRequest:id,reference_number,client_name,event_title',
            ])),
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
