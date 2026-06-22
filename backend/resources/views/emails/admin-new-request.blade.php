<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; }
        .header { background: #0B3D91; color: white; padding: 20px 30px; }
        .badge { background: #D4AF37; color: #0B3D91; display: inline-block; padding: 4px 12px; font-weight: bold; margin-top: 8px; }
        .content { padding: 24px 30px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        td.label { font-weight: bold; color: #64748b; width: 140px; }
        .btn { display: inline-block; background: #0B3D91; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .footer { padding: 16px 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="header">
        <h2 style="margin:0;">New Service Request</h2>
        <div class="badge">{{ $serviceRequest->reference_number }}</div>
    </div>
    <div class="content">
        <p>A new service request has been submitted and requires your review.</p>
        <table>
            <tr><td class="label">Client</td><td>{{ $serviceRequest->client_name }}</td></tr>
            <tr><td class="label">Phone</td><td>{{ $serviceRequest->client_phone }}</td></tr>
            @if($serviceRequest->client_email)<tr><td class="label">Email</td><td>{{ $serviceRequest->client_email }}</td></tr>@endif
            <tr><td class="label">Event</td><td>{{ $serviceRequest->event_title }} ({{ $serviceRequest->event_type }})</td></tr>
            <tr><td class="label">Date</td><td>{{ $serviceRequest->event_date->format('d M Y') }}</td></tr>
            @if($serviceRequest->venue)<tr><td class="label">Venue</td><td>{{ $serviceRequest->venue }}</td></tr>@endif
            <tr><td class="label">Services</td><td>{{ $serviceRequest->items->pluck('service_name')->join(', ') }}</td></tr>
        </table>
        <a href="{{ $reviewUrl }}" class="btn">Review Request</a>
        <p style="margin-top:20px; font-size:13px; color:#64748b;">
            Tracking link: <a href="{{ $trackingUrl }}">{{ $trackingUrl }}</a>
        </p>
        <p style="font-size:13px; color:#64748b;">PDF copy attached.</p>
    </div>
    <div class="footer">
        {{ config('wasender.company_name') }} — Automated notification
    </div>
</body>
</html>
