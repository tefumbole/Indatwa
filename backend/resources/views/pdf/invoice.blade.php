<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice — {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; }
        .header { background: #0B3D91; color: white; padding: 20px 30px; margin-bottom: 20px; }
        .header h1 { font-size: 17px; }
        .ref-badge { background: #FACC15; color: #0B3D91; display: inline-block; padding: 6px 14px; font-weight: bold; margin-top: 8px; }
        .content { padding: 0 30px 24px; }
        .section-title { font-size: 11px; font-weight: bold; color: #0B3D91; border-bottom: 2px solid #FACC15; padding-bottom: 4px; margin: 16px 0 8px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #e2e8f0; text-align: left; }
        th { background: #f1f5f9; color: #0B3D91; }
        .totals { margin-top: 12px; text-align: right; }
        .grand { font-size: 14px; font-weight: bold; color: #0B3D91; }
        .footer { margin-top: 24px; font-size: 9px; color: #64748b; text-align: center; }
        .qr { width: 90px; height: 90px; float: right; border: 3px solid #FACC15; background: white; padding: 4px; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoUrl))<img src="{{ $logoUrl }}" style="max-height:40px;margin-bottom:6px;" alt="Logo">@endif
        <h1>{{ $companyName }}</h1>
        <p>{{ $companyLocation }} &bull; {{ $companyPhone }}</p>
        <div class="ref-badge">INVOICE {{ $invoice->invoice_number }}</div>
        @if(!empty($qrDataUri))<img src="{{ $qrDataUri }}" class="qr" alt="QR">@endif
    </div>
    <div class="content">
        <div class="section-title">Bill To</div>
        <p><strong>{{ $request->client_name }}</strong><br>{{ $request->client_phone }}@if($request->client_email)<br>{{ $request->client_email }}@endif</p>
        <p style="margin-top:8px;">Reference: {{ $request->reference_number }} · Event: {{ $request->event_title }}</p>

        <div class="section-title">Services</div>
        <table>
            <thead><tr><th>Service</th><th>Amount (RWF)</th></tr></thead>
            <tbody>
                @foreach($request->items->where('status', 'approved')->where('client_status', 'accepted') as $item)
                <tr><td>{{ $item->service_name }}</td><td>{{ number_format($item->quoted_price, 0) }}</td></tr>
                @endforeach
                @if($request->miscellaneous_amount)
                <tr><td>Miscellaneous</td><td>{{ number_format($request->miscellaneous_amount, 0) }}</td></tr>
                @endif
            </tbody>
        </table>

        <div class="totals">
            <p>Total: {{ number_format($invoice->total_amount, 0) }} RWF</p>
            <p>Paid: {{ number_format($invoice->amount_paid, 0) }} RWF</p>
            <p class="grand">Balance Due: {{ number_format($invoice->total_amount - $invoice->amount_paid, 0) }} RWF</p>
        </div>

        @if($invoice->payments->count())
        <div class="section-title">Payment History</div>
        <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
            <tbody>
                @foreach($invoice->payments as $payment)
                <tr>
                    <td>{{ $payment->paid_at ? $payment->paid_at->format('d M Y') : '—' }}</td>
                    <td>{{ number_format($payment->amount, 0) }}</td>
                    <td>{{ $payment->payment_method ?? '—' }}</td>
                    <td>{{ $payment->reference ?? '—' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        <div class="footer">
            @if(!empty($footerHtml)){!! $footerHtml !!}@else<p>{{ $companyName }}</p>@endif
        </div>
    </div>
</body>
</html>
