<?php

namespace App\Http\Controllers\Api\V1\Open;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SiteController extends Controller
{
    public function branding(): JsonResponse
    {
        $settings = app(\App\Services\SiteSettingsService::class)->branding();

        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function publicSettings(): JsonResponse
    {
        $settings = DB::table('site_settings')->pluck('value', 'key');

        $defaults = [
            'company_name' => 'Indatwa Protocol & Services Agency',
            'location' => 'Kimironko, Kigali, Rwanda',
            'whatsapp' => '+250780759253',
            'email' => 'info@indatwagency.com',
            'primary_color' => '#0B3D91',
            'secondary_color' => '#D4AF37',
            'developed_by' => 'Alpha Bridge Technologies',
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings->map(fn ($v) => json_decode($v, true))->toArray()),
        ]);
    }

    public function testimonials(): JsonResponse
    {
        $items = DB::table('testimonials')
            ->where('is_active', true)
            ->orderByDesc('is_featured')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function faqs(): JsonResponse
    {
        $items = DB::table('faqs')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function gallery(): JsonResponse
    {
        $items = DB::table('gallery_items')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }
}
