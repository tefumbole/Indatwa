<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = DB::table('site_settings')->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings->map(fn ($v) => json_decode($v, true))->toArray(),
        ]);
    }

    public function updateReviews(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        DB::table('site_settings')->updateOrInsert(
            ['key' => 'reviews_enabled'],
            ['value' => json_encode($validated['enabled']), 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['success' => true, 'data' => ['reviews_enabled' => $validated['enabled']]]);
    }
}
