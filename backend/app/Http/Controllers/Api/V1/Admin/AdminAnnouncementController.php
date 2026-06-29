<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementSetting;
use App\Models\AnnouncementTemplate;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\Announcements\AnnouncementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnnouncementController extends Controller
{
    private AnnouncementService $announcements;

    public function __construct(AnnouncementService $announcements)
    {
        $this->announcements = $announcements;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Announcement::with('creator:id,name')->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json(['success' => true, 'data' => $query->limit(100)->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $recipientsInput = $request->input('recipients');
        if (is_string($recipientsInput)) {
            $request->merge(['recipients' => json_decode($recipientsInput, true) ?: []]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'category' => 'nullable|string|max:100',
            'header' => 'nullable|string|max:2000',
            'footer' => 'nullable|string|max:2000',
            'audience_type' => 'required|in:clients,staff,custom',
            'recipients' => 'nullable|array',
            'recipients.*.name' => 'nullable|string|max:255',
            'recipients.*.phone' => 'required_with:recipients|string|max:20',
            'recipients.*.email' => 'nullable|email',
            'send_now' => 'nullable|boolean',
            'scheduled_at' => 'nullable|date|after:now',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'file|max:10240',
        ]);

        $attachments = $request->hasFile('attachments')
            ? $this->announcements->storeAttachments($request->file('attachments'))
            : [];

        $announcement = $this->announcements->createAndMaybeSend([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'category' => $validated['category'] ?? null,
            'header' => $validated['header'] ?? null,
            'footer' => $validated['footer'] ?? null,
            'audience_type' => $validated['audience_type'],
            'recipients' => $validated['recipients'] ?? [],
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'attachments' => $attachments,
        ], $request->user()->id, (bool) ($validated['send_now'] ?? false));

        return response()->json(['success' => true, 'data' => $announcement], 201);
    }

    public function sendNow(int $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);

        try {
            $this->announcements->send($announcement);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'data' => $announcement->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        Announcement::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Announcement removed.']);
    }

    public function settings(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => AnnouncementSetting::singleton()]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'default_header' => 'nullable|string|max:2000',
            'serial_prefix' => 'nullable|string|max:20',
            'next_serial' => 'nullable|integer|min:1',
            'timezone' => 'nullable|string|max:50',
        ]);

        $settings = AnnouncementSetting::singleton();
        $settings->update($validated);

        return response()->json(['success' => true, 'data' => $settings->fresh()]);
    }

    public function templates(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => AnnouncementTemplate::orderByDesc('updated_at')->get(),
        ]);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'subject' => 'nullable|string|max:255',
            'header' => 'nullable|string|max:2000',
            'body' => 'required|string|max:10000',
            'footer' => 'nullable|string|max:2000',
        ]);

        $template = AnnouncementTemplate::create(array_merge($validated, [
            'created_by' => $request->user()->id,
        ]));

        return response()->json(['success' => true, 'data' => $template], 201);
    }

    public function recipientClients(): JsonResponse
    {
        $clients = ServiceRequest::select('client_name as name', 'client_phone as phone', 'client_email as email')
            ->whereNotNull('client_phone')
            ->orderByDesc('submitted_at')
            ->limit(200)
            ->get()
            ->unique('phone')
            ->values();

        return response()->json(['success' => true, 'data' => $clients]);
    }

    public function recipientStaff(): JsonResponse
    {
        $staff = User::whereHas('roles', fn ($q) => $q->where('name', '!=', 'client'))
            ->whereNotNull('phone')
            ->select('id', 'name', 'phone', 'email')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $staff]);
    }

    public function processScheduled(): JsonResponse
    {
        $count = $this->announcements->processScheduled();

        return response()->json(['success' => true, 'data' => ['processed' => $count]]);
    }
}
