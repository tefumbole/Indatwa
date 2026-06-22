<?php

namespace App\Http\Controllers\Api\V1\WhatsApp;

use App\Http\Controllers\Controller;
use App\Services\WhatsApp\WhatsAppService;
use App\Support\PhoneFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    private $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'text' => 'required|string|max:4096',
            'message_type' => 'nullable|string|max:50',
        ]);

        $phone = PhoneFormatter::toE164($validated['phone']);
        if (! $phone) {
            return response()->json(['success' => false, 'message' => 'Invalid phone'], 422);
        }

        $result = $this->whatsapp->sendNotification(
            $phone,
            $validated['text'],
            $validated['message_type'] ?? 'manual_send',
            null,
            null,
            $request->user()->id,
        );

        return response()->json([
            'success' => $result['success'] ?? false,
            'data' => $result,
        ], ($result['success'] ?? false) ? 200 : 422);
    }

    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'nullable|string',
        ]);

        $phone = PhoneFormatter::toE164($validated['phone'] ?? config('wasender.admin_phone'));
        if (! $phone) {
            return response()->json(['success' => false, 'message' => 'Invalid phone'], 422);
        }

        if (! $this->whatsapp->isConfigured()) {
            return response()->json(['success' => false, 'message' => 'WasenderAPI not configured'], 503);
        }

        $company = config('wasender.company_name');
        $result = $this->whatsapp->sendNotification(
            $phone,
            "✅ Test message from {$company}. WasenderAPI is working correctly.",
            'test',
            null,
            null,
            $request->user()->id,
        );

        return response()->json([
            'success' => $result['success'] ?? false,
            'data' => $result,
            'message' => ($result['success'] ?? false) ? 'Test message sent' : ($result['error'] ?? 'Send failed'),
        ]);
    }
}
