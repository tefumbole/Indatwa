<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Service Request — {{ $request->reference_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; }
        .header { background: #0B3D91; color: white; padding: 24px 30px; margin-bottom: 24px; }
        .header h1 { font-size: 18px; margin-bottom: 4px; }
        .header p { font-size: 10px; opacity: 0.85; }
        .ref-badge { background: #D4AF37; color: #0B3D91; display: inline-block; padding: 6px 14px; font-weight: bold; font-size: 13px; margin-top: 10px; }
        .content { padding: 0 30px 30px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: bold; color: #0B3D91; border-bottom: 2px solid #D4AF37; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        table.info { width: 100%; border-collapse: collapse; }
        table.info td { padding: 5px 8px; vertical-align: top; }
        table.info td.label { font-weight: bold; color: #64748b; width: 35%; }
        table.services { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.services th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; color: #0B3D91; border: 1px solid #e2e8f0; }
        table.services td { padding: 8px; border: 1px solid #e2e8f0; }
        .signature-box { border: 1px solid #e2e8f0; padding: 10px; margin-top: 8px; text-align: center; }
        .signature-box img { max-height: 80px; max-width: 250px; }
        .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
        .status { display: inline-block; background: #dbeafe; color: #0B3D91; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 10px; }
        .doc-list { list-style: none; }
        .doc-list li { padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $companyName }}</h1>
        <p>{{ $companyLocation }} &bull; {{ $companyPhone }}</p>
        <div class="ref-badge">{{ $request->reference_number }}</div>
    </div>

    <div class="content">
        <div class="section">
            <div class="section-title">Request Status</div>
            <span class="status">{{ strtoupper(str_replace('_', ' ', $request->status)) }}</span>
            <span style="margin-left: 12px; color: #64748b;">Submitted: {{ $request->submitted_at->format('d M Y, H:i') }}</span>
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
                @if($request->event_start_date)<tr><td class="label">Start Date</td><td>{{ $request->event_start_date->format('d M Y') }}</td></tr>@endif
                @if($request->event_end_date)<tr><td class="label">End Date</td><td>{{ $request->event_end_date->format('d M Y') }}</td></tr>@endif
                @if($request->number_of_guests)<tr><td class="label">Guests</td><td>{{ $request->number_of_guests }}</td></tr>@endif
                @if($request->venue)<tr><td class="label">Venue</td><td>{{ $request->venue }}</td></tr>@endif
                @if($request->event_description)<tr><td class="label">Description</td><td>{{ $request->event_description }}</td></tr>@endif
            </table>
        </div>

        <div class="section">
            <div class="section-title">Requested Services</div>
            <table class="services">
                <thead><tr><th>#</th><th>Service</th><th>Status</th>@if($request->quoted_amount)<th>Amount (RWF)</th>@endif</tr></thead>
                <tbody>
                    @foreach($request->items as $i => $item)
                    <tr>
                        <td>{{ $i + 1 }}</td>
                        <td>{{ $item->service_name }}</td>
                        <td>{{ ucfirst($item->status) }}</td>
                        @if($request->quoted_amount)<td>{{ $item->quoted_price ? number_format($item->quoted_price, 0) : '—' }}</td>@endif
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @if($request->quoted_amount)
            <p style="margin-top: 10px; font-weight: bold; text-align: right;">Total Quoted: {{ number_format($request->quoted_amount, 0) }} RWF</p>
            @if($request->quotation_notes)<p style="margin-top: 6px; font-size: 10px; color: #64748b;">{{ $request->quotation_notes }}</p>@endif
            @endif
        </div>

        @if($request->documents->count())
        <div class="section">
            <div class="section-title">Uploaded Documents</div>
            <ul class="doc-list">
                @foreach($request->documents as $doc)
                <li>{{ ucfirst(str_replace('_', ' ', $doc->document_type)) }} — {{ $doc->original_name }}</li>
                @endforeach
            </ul>
        </div>
        @endif

        <div class="section">
            <div class="section-title">Digital Signature</div>
            <div class="signature-box">
                @if($signatureData)
                    <img src="data:image/png;base64,{{ $signatureData }}" alt="Signature">
                @else
                    <p style="color: #94a3b8;">No signature on file</p>
                @endif
            </div>
            <p style="margin-top: 6px; font-size: 9px; color: #94a3b8;">Signed by {{ $request->client_name }} on {{ ($request->client_signed_at ?? $request->submitted_at)->format('d M Y') }}</p>
        </div>

        <div class="footer">
            <p>This document was generated by {{ $companyName }}.</p>
            <p>Reference: {{ $request->reference_number }} &bull; Developed by Alpha Bridge Technologies</p>
        </div>
    </div>
</body>
</html>
