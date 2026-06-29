<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarDate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBookingController extends Controller
{
    public function month(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        $start = sprintf('%04d-%02d-01', $year, $month);
        $end = date('Y-m-t', strtotime($start));

        $booked = CalendarDate::with('serviceRequest:id,reference_number,event_title,client_name')
            ->whereBetween('date', [$start, $end])
            ->where('is_booked', true)
            ->get()
            ->map(fn (CalendarDate $d) => [
                'date' => $d->date->format('Y-m-d'),
                'is_booked' => true,
                'label' => $d->label,
                'notes' => $d->notes,
                'service_request' => $d->serviceRequest ? [
                    'id' => $d->serviceRequest->id,
                    'reference_number' => $d->serviceRequest->reference_number,
                    'event_title' => $d->serviceRequest->event_title,
                    'client_name' => $d->serviceRequest->client_name,
                ] : null,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'month' => $month,
                'booked_dates' => $booked,
            ],
        ]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'is_booked' => 'required|boolean',
            'service_request_id' => 'nullable|exists:service_requests,id',
            'label' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:2000',
        ]);

        if (! $validated['is_booked']) {
            CalendarDate::where('date', $validated['date'])->delete();

            return response()->json(['success' => true, 'data' => ['date' => $validated['date'], 'is_booked' => false]]);
        }

        $entry = CalendarDate::updateOrCreate(
            ['date' => $validated['date']],
            [
                'is_booked' => true,
                'service_request_id' => $validated['service_request_id'] ?? null,
                'label' => $validated['label'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json(['success' => true, 'data' => $entry]);
    }
}
