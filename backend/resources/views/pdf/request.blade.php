<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Service Request — {{ $request->reference_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; }
        .header { background: #0B3D91; color: white; padding: 20px 30px; margin-bottom: 20px; position: relative; }
        .header-inner { display: table; width: 100%; }
        .header-left { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; width: 130px; }
        .header h1 { font-size: 17px; margin-bottom: 4px; }
        .header p { font-size: 10px; opacity: 0.9; }
        .ref-badge { background: #FACC15; color: #0B3D91; display: inline-block; padding: 6px 14px; font-weight: bold; font-size: 12px; margin-top: 8px; }
        .logo { max-height: 48px; max-width: 120px; margin-bottom: 6px; }
        .qr { width: 96px; height: 96px; border: 3px solid #FACC15; background: white; padding: 4px; }
        .content { padding: 0 30px 24px; }
        .section { margin-bottom: 18px; }
        .section-title { font-size: 11px; font-weight: bold; color: #0B3D91; border-bottom: 2px solid #FACC15; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        table.info { width: 100%; border-collapse: collapse; }
        table.info td { padding: 4px 8px; vertical-align: top; }
        table.info td.label { font-weight: bold; color: #475569; width: 34%; }
        table.services { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.services th { background: #f1f5f9; padding: 7px; text-align: left; font-size: 10px; color: #0B3D91; border: 1px solid #e2e8f0; }
        table.services td { padding: 7px; border: 1px solid #e2e8f0; }
        .badge-approved { color: #15803d; font-weight: bold; }
        .badge-rejected { color: #b91c1c; font-weight: bold; }
        .badge-pending { color: #a16207; font-weight: bold; }
        .signature-box { border: 1px solid #e2e8f0; padding: 10px; margin-top: 8px; text-align: center; }
        .signature-box img { max-height: 80px; max-width: 250px; }
        .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; text-align: center; }
        .agreement { background: #0a2560; color: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 10px; }
        .agreement h3 { color: #FACC15; font-size: 12px; margin-bottom: 8px; }
        .agreement p { margin-bottom: 8px; font-size: 10px; }
        .totals { text-align: right; margin-top: 8px; font-size: 11px; }
        .totals .grand { font-size: 13px; font-weight: bold; color: #0B3D91; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-inner">
            <div class="header-left">
                @if(!empty($logoUrl))<img src="{{ $logoUrl }}" class="logo" alt="Logo">@endif
                <h1>{{ $companyName }}</h1>
                <p>{{ $companyLocation }} &bull; {{ $companyPhone }}</p>
                @if(!empty($headerHtml))<div style="margin-top:6px;font-size:10px;">{!! $headerHtml !!}</div>@endif
                <div class="ref-badge">{{ $request->reference_number }}</div>
            </div>
            <div class="header-right">
                @if(!empty($qrDataUri))
                    <img src="{{ $qrDataUri }}" class="qr" alt="QR">
                    <p style="font-size:8px;margin-top:4px;">Scan for event details</p>
                @endif
            </div>
        </div>
    </div>

    <div class="content">
        <div class="section">
            <div class="section-title">Request Status</div>
            <span class="badge-pending">{{ strtoupper(str_replace('_', ' ', $request->status)) }}</span>
            <span style="margin-left: 10px; color: #64748b;">Submitted: {{ $request->submitted_at->format('d M Y, H:i') }}</span>
        </div>

        <div class="section">
            <div class="section-title">Client Information</div>
            <table class="info">
                <tr><td class="label">Full Name</td><td>{{ $request->client_name }}</td></tr>
                <tr><td class="label">Phone</td><td>{{ $request->client_phone }}</td></tr>
                @if($request->client_email)<tr><td class="label">Email</td><td>{{ $request->client_email }}</td></tr>@endif
                @if($request->client_nationality)<tr><td class="label">Nationality</td><td>{{ $request->client_nationality }}</td></tr>@endif
                @if($request->client_country)<tr><td class="label">Country</td><td>{{ $request->client_country }}</td></tr>@endif
                @if($request->client_city)<tr><td class="label">City</td><td>{{ $request->client_city }}</td></tr>@endif
            </table>
        </div>

        <div class="section">
            <div class="section-title">Event Information</div>
            <table class="info">
                <tr><td class="label">Event Title</td><td>{{ $request->event_title }}</td></tr>
                <tr><td class="label">Event Type</td><td>{{ $request->event_type }}</td></tr>
                <tr><td class="label">Event Date</td><td>{{ $request->event_date->format('d M Y') }}</td></tr>
                @if($request->venue)<tr><td class="label">Venue</td><td>{{ $request->venue }}</td></tr>@endif
                @if($request->event_description)<tr><td class="label">Description</td><td>{{ $request->event_description }}</td></tr>@endif
            </table>
        </div>

        <div class="section">
            <div class="section-title">Services & Quotation</div>
            <table class="services">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Service</th>
                        <th>Admin</th>
                        <th>Client</th>
                        @if(!$hideAmounts && ($request->quoted_amount || $request->items->where('quoted_price')->count()))<th>Amount (RWF)</th>@endif
                    </tr>
                </thead>
                <tbody>
                    @foreach($request->items as $i => $item)
                    <tr>
                        <td>{{ $i + 1 }}</td>
                        <td>{{ $item->service_name }}</td>
                        <td class="badge-{{ $item->status === 'approved' ? 'approved' : ($item->status === 'rejected' ? 'rejected' : 'pending') }}">{{ ucfirst($item->status) }}</td>
                        <td class="badge-{{ $item->client_status === 'accepted' ? 'approved' : ($item->client_status === 'rejected' ? 'rejected' : 'pending') }}">{{ ucfirst(str_replace('_', ' ', $item->client_status ?? 'pending')) }}</td>
                        @if(!$hideAmounts && ($request->quoted_amount || $request->items->where('quoted_price')->count()))
                        <td>{{ ($item->status === 'approved' && $item->quoted_price) ? number_format($item->quoted_price, 0) : '—' }}</td>
                        @endif
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @if(!$hideAmounts && $request->quoted_amount)
            <div class="totals">
                @if($request->miscellaneous_amount)<p>Miscellaneous: {{ number_format($request->miscellaneous_amount, 0) }} RWF</p>@endif
                <p class="grand">Total: {{ number_format($request->quoted_amount, 0) }} RWF</p>
                @if($request->quotation_notes)<p style="margin-top:6px;color:#64748b;">{{ $request->quotation_notes }}</p>@endif
            </div>
            @endif
        </div>

        @if($showAgreement && !empty($agreementHtml))
        <div class="section">
            <div class="section-title">Rental & Service Agreement</div>
            <div class="agreement">{!! $agreementHtml !!}</div>
            @if($request->agreement_accepted_at)
            <p style="margin-top:6px;font-size:9px;color:#64748b;">Agreement accepted on {{ $request->agreement_accepted_at->format('d M Y, H:i') }}</p>
            @endif
        </div>
        @endif

        @if($signatureData)
        <div class="section">
            <div class="section-title">Digital Signature</div>
            <div class="signature-box">
                <img src="data:image/png;base64,{{ $signatureData }}" alt="Signature">
            </div>
        </div>
        @endif

        <div class="footer">
            @if(!empty($footerHtml)){!! $footerHtml !!}@else
            <p>This document was generated by {{ $companyName }}.</p>
            @endif
            <p>Reference: {{ $request->reference_number }}</p>
        </div>
    </div>
</body>
</html>
