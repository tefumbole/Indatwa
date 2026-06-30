<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SiteSettingsService
{
    public function all(): array
    {
        $rows = DB::table('site_settings')->pluck('value', 'key');
        $out = [];
        foreach ($rows as $key => $value) {
            $decoded = json_decode($value, true);
            $out[$key] = $decoded === null && $value !== 'null' ? $value : $decoded;
        }

        return $out;
    }

    public function get(string $key, $default = null)
    {
        $value = DB::table('site_settings')->where('key', $key)->value('value');
        if ($value === null) {
            return $default;
        }
        $decoded = json_decode($value, true);

        return $decoded === null && $value !== 'null' ? $value : $decoded;
    }

    public function set(string $key, $value): void
    {
        $stored = is_string($value) ? json_encode($value) : json_encode($value);
        DB::table('site_settings')->updateOrInsert(
            ['key' => $key],
            ['value' => $stored, 'updated_at' => now(), 'created_at' => now()]
        );
    }

    public function branding(): array
    {
        $logoPath = $this->get('logo_path');
        $logoUrl = $logoPath && Storage::disk('public')->exists($logoPath)
            ? Storage::disk('public')->url($logoPath)
            : null;

        return [
            'company_name' => $this->get('company_name', config('ips.company_name')),
            'company_phone' => $this->get('company_phone', config('ips.company_phone')),
            'company_location' => $this->get('company_location', config('ips.company_location')),
            'pdf_header_html' => $this->get('pdf_header_html', ''),
            'pdf_footer_html' => $this->get('pdf_footer_html', ''),
            'logo_path' => $logoPath,
            'logo_url' => $logoUrl,
            'rental_agreement_html' => $this->get('rental_agreement_html', $this->defaultAgreementHtml()),
        ];
    }

    public function defaultAgreementHtml(): string
    {
        return implode("\n", [
            '<p><strong>1. Service Preparation</strong></p>',
            '<p>Some services require advance booking with third-party vendors. Indatwa Protocol & Services will confirm availability before final acceptance.</p>',
            '<p><strong>2. Payment Terms</strong></p>',
            '<p>Full or agreed partial payment must be received <strong>no later than two (2) days before</strong> the event date. Late payment may delay or cancel service delivery.</p>',
            '<p><strong>3. Confirmation & Refunds</strong></p>',
            '<p>After the client confirms and signs this agreement, <strong>refunds are not possible</strong>. Cancellations after confirmation remain the client\'s financial responsibility for accepted services.</p>',
            '<p><strong>4. Client Responsibilities</strong></p>',
            '<p>The client is responsible for accurate event information, timely communication, venue access, and any specific dressing or protocol requirements communicated to our team.</p>',
            '<p><strong>5. Partial Services</strong></p>',
            '<p>The client may accept or reject individual quoted services. Total payable amount reflects only accepted services plus any miscellaneous charges disclosed in the quotation.</p>',
        ]);
    }
}
