<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\ServiceRequest;
use App\Services\Notifications\RequestNotificationService;
use App\Services\RequestPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tab = $request->query('tab', 'all');

        $query = Invoice::with(['serviceRequest:id,reference_number,client_name,client_phone,event_title,status'])
            ->orderByDesc('updated_at');

        if ($tab === 'awaiting') {
            $query->whereIn('status', ['sent', 'partial'])
                ->whereRaw('total_amount > amount_paid');
        }

        $invoices = $query->with(['payments.recorder:id,name'])->get()->map(fn (Invoice $inv) => $this->formatInvoice($inv, true));

        return response()->json(['success' => true, 'data' => $invoices]);
    }

    public function recordPayment(Request $request, int $invoiceId): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'nullable|string|max:50',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:2000',
            'paid_at' => 'nullable|date',
        ]);

        $invoice = Invoice::with('serviceRequest')->findOrFail($invoiceId);
        $balance = $invoice->balanceDue();

        if ($validated['amount'] > $balance + 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'Payment exceeds balance due ('.number_format($balance, 0).' RWF)',
            ], 422);
        }

        DB::transaction(function () use ($invoice, $validated, $request) {
            InvoicePayment::create([
                'invoice_id' => $invoice->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'] ?? 'manual',
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $request->user()->id,
                'paid_at' => $validated['paid_at'] ?? now(),
                'status' => 'confirmed',
            ]);

            $invoice->refresh();
            $paid = (float) $invoice->payments()->sum('amount');
            $invoice->update([
                'amount_paid' => $paid,
                'status' => $paid >= (float) $invoice->total_amount ? 'paid' : 'partial',
            ]);

            if ($invoice->serviceRequest && $invoice->status === 'paid') {
                $invoice->serviceRequest->update(['status' => 'approved']);
            } elseif ($invoice->serviceRequest && $paid > 0) {
                $invoice->serviceRequest->update(['status' => 'awaiting_payment']);
            }
        });

        $invoice->refresh()->load(['serviceRequest', 'payments']);

        return response()->json([
            'success' => true,
            'data' => $this->formatInvoice($invoice, true),
        ]);
    }

    public function sendInvoice(Request $request, int $invoiceId, RequestNotificationService $notifications): JsonResponse
    {
        $invoice = Invoice::with(['serviceRequest.items'])->findOrFail($invoiceId);
        $serviceRequest = $invoice->serviceRequest;

        if (! $serviceRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found'], 404);
        }

        app(RequestPdfService::class)->generateInvoice($invoice);
        $invoice->update(['sent_at' => now(), 'status' => $invoice->status === 'draft' ? 'sent' : $invoice->status]);

        try {
            $notifications->sendInvoice($serviceRequest->fresh(), $invoice->fresh());
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Invoice send failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatInvoice($invoice->fresh()->load('serviceRequest'), true),
            'message' => 'Invoice sent to client',
        ]);
    }

    public function downloadInvoice(int $invoiceId)
    {
        $invoice = Invoice::with('serviceRequest')->findOrFail($invoiceId);
        $path = "invoices/{$invoice->invoice_number}.pdf";

        if (! Storage::disk('public')->exists($path)) {
            app(RequestPdfService::class)->generateInvoice($invoice);
        }

        return response()->download(
            Storage::disk('public')->path($path),
            "{$invoice->invoice_number}.pdf"
        );
    }

    private function formatInvoice(Invoice $invoice, bool $withPayments = false): array
    {
        $req = $invoice->serviceRequest;

        $data = [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'total_amount' => (float) $invoice->total_amount,
            'amount_paid' => (float) $invoice->amount_paid,
            'balance_due' => $invoice->balanceDue(),
            'currency' => $invoice->currency,
            'status' => $invoice->status,
            'due_date' => $invoice->due_date ? $invoice->due_date->format('Y-m-d') : null,
            'sent_at' => $invoice->sent_at ? $invoice->sent_at->toIso8601String() : null,
            'updated_at' => $invoice->updated_at ? $invoice->updated_at->toIso8601String() : null,
            'service_request' => $req ? [
                'id' => $req->id,
                'reference_number' => $req->reference_number,
                'client_name' => $req->client_name,
                'client_phone' => $req->client_phone,
                'event_title' => $req->event_title,
                'status' => $req->status,
            ] : null,
        ];

        if ($withPayments) {
            $data['payments'] = $invoice->payments()
                ->with('recorder:id,name')
                ->orderByDesc('paid_at')
                ->get()
                ->map(fn (InvoicePayment $p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'payment_method' => $p->payment_method,
                    'reference' => $p->reference,
                    'notes' => $p->notes,
                    'paid_at' => $p->paid_at ? $p->paid_at->toIso8601String() : null,
                    'recorded_by' => $p->recorder ? $p->recorder->name : null,
                ]);
        }

        return $data;
    }
}
