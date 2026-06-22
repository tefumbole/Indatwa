<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $statusCounts = ServiceRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', submitted_at)"
            : "DATE_FORMAT(submitted_at, '%Y-%m')";

        $monthlyTrend = ServiceRequest::select(
            DB::raw("{$monthExpr} as month"),
            DB::raw('count(*) as count')
        )
            ->where('submitted_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $popularServices = DB::table('service_request_items')
            ->select('service_name', DB::raw('count(*) as count'))
            ->groupBy('service_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $recentRequests = ServiceRequest::withCount('items')
            ->orderByDesc('submitted_at')
            ->limit(8)
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'reference_number' => $r->reference_number,
                    'client_name' => $r->client_name,
                    'event_title' => $r->event_title,
                    'status' => $r->status,
                    'submitted_at' => $r->submitted_at ? $r->submitted_at->toIso8601String() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_requests' => ServiceRequest::count(),
                    'pending_review' => ServiceRequest::whereIn('status', ['submitted', 'under_review'])->count(),
                    'in_progress' => ServiceRequest::whereIn('status', ['approved', 'in_progress'])->count(),
                    'completed' => ServiceRequest::where('status', 'completed')->count(),
                    'total_clients' => User::whereHas('roles', function ($q) {
                        $q->where('name', 'client');
                    })->count(),
                    'active_services' => Service::where('is_active', true)->count(),
                ],
                'status_counts' => $statusCounts,
                'monthly_trend' => $monthlyTrend,
                'popular_services' => $popularServices,
                'recent_requests' => $recentRequests,
            ],
        ]);
    }
}
