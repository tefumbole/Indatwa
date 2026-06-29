<?php

namespace App\Http\Controllers\Api\V1\Open;

use App\Http\Controllers\Controller;
use App\Services\Notifications\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class CronController extends Controller
{
    public function taskReminders(Request $request, TaskNotificationService $notifications): JsonResponse
    {
        $token = $request->query('token') ?? $request->header('X-Cron-Token');
        $secret = config('app.cron_secret');

        if (! $secret || ! hash_equals($secret, (string) $token)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $result = $notifications->sendDueReminders();
        Log::info('Cron task reminders', $result);

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function runSchedule(Request $request): JsonResponse
    {
        $token = $request->query('token') ?? $request->header('X-Cron-Token');
        $secret = config('app.cron_secret');

        if (! $secret || ! hash_equals($secret, (string) $token)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        Artisan::call('tasks:send-reminders');

        return response()->json([
            'success' => true,
            'output' => Artisan::output(),
        ]);
    }
}
