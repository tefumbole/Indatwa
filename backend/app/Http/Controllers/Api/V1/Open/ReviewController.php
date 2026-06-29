<?php

namespace App\Http\Controllers\Api\V1\Open;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        if (! $this->reviewsEnabled()) {
            return response()->json(['success' => true, 'data' => [], 'meta' => ['enabled' => false]]);
        }

        $reviews = DB::table('service_reviews')
            ->where('is_published', true)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'client_name', 'rating', 'comment', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'meta' => ['enabled' => true],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->reviewsEnabled()) {
            return response()->json(['success' => false, 'message' => 'Reviews are currently disabled'], 403);
        }

        $validated = $request->validate([
            'service_request_id' => 'required|integer|exists:service_requests,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $serviceRequest = ServiceRequest::findOrFail($validated['service_request_id']);
        $user = $request->user();

        if ($user && $serviceRequest->user_id && $serviceRequest->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($serviceRequest->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'You can review only after the service is completed'], 422);
        }

        if (DB::table('service_reviews')->where('service_request_id', $serviceRequest->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'You have already reviewed this service'], 422);
        }

        $id = DB::table('service_reviews')->insertGetId([
            'service_request_id' => $serviceRequest->id,
            'user_id' => $user ? $user->id : null,
            'client_name' => $serviceRequest->client_name,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('service_reviews')->find($id),
        ], 201);
    }

    private function reviewsEnabled(): bool
    {
        $row = DB::table('site_settings')->where('key', 'reviews_enabled')->value('value');

        return $row ? (bool) json_decode($row, true) : true;
    }
}
