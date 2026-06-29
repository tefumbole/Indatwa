<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminWhatsAppController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('whatsapp_notifications')->orderByDesc('created_at');

        if ($type = $request->query('message_type')) {
            $query->where('message_type', 'like', $type.'%');
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $logs = $query->limit(50)->get();

        $stats = [
            'total' => DB::table('whatsapp_notifications')->count(),
            'sent' => DB::table('whatsapp_notifications')->where('status', 'sent')->count(),
            'failed' => DB::table('whatsapp_notifications')->where('status', 'failed')->count(),
            'configured' => ! empty(config('wasender.api_key')),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'logs' => $logs,
            ],
        ]);
    }
}
