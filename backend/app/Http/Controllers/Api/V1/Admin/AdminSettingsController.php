<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\SiteSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminSettingsController extends Controller
{
    public function index(SiteSettingsService $settings): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => array_merge($settings->all(), $settings->branding()),
        ]);
    }

    public function updateReviews(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        DB::table('site_settings')->updateOrInsert(
            ['key' => 'reviews_enabled'],
            ['value' => json_encode($validated['enabled']), 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['success' => true, 'data' => ['reviews_enabled' => $validated['enabled']]]);
    }

    public function updateBranding(Request $request, SiteSettingsService $settings): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'company_phone' => 'nullable|string|max:50',
            'company_location' => 'nullable|string|max:255',
            'pdf_header_html' => 'nullable|string|max:10000',
            'pdf_footer_html' => 'nullable|string|max:10000',
            'rental_agreement_html' => 'nullable|string|max:50000',
        ]);

        foreach ($validated as $key => $value) {
            if ($value !== null) {
                $settings->set($key, $value);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $settings->branding(),
        ]);
    }

    public function uploadLogo(Request $request, SiteSettingsService $settings): JsonResponse
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $oldPath = $settings->get('logo_path');
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('logo')->store('branding', 'public');
        $settings->set('logo_path', $path);

        return response()->json([
            'success' => true,
            'data' => $settings->branding(),
        ]);
    }
}
