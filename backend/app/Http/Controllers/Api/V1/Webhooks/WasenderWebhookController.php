<?php

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WasenderWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        Log::info('Wasender webhook received', $request->all());

        $msgId = $request->input('msgId') ?? $request->input('data.msgId');
        $status = $request->input('status') ?? $request->input('data.status');

        if ($msgId && $status) {
            $mapped = null;
            switch (strtolower($status)) {
                case 'delivered':
                case 'read':
                    $mapped = 'delivered';
                    break;
                case 'sent':
                    $mapped = 'sent';
                    break;
                case 'failed':
                    $mapped = 'failed';
                    break;
            }

            if ($mapped) {
                DB::table('whatsapp_notifications')
                    ->where('provider_sid', $msgId)
                    ->update(['status' => $mapped, 'updated_at' => now()]);
            }
        }

        return response()->json(['success' => true]);
    }
}
