<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\OtpService;
use App\Support\PhoneFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    private $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'email' => 'nullable|email|max:255|unique:users,email',
        ]);

        $phone = PhoneFormatter::toE164($validated['phone']);
        if (! $phone) {
            return response()->json(['success' => false, 'message' => 'Invalid phone number'], 422);
        }

        if (User::where('phone', $phone)->exists()) {
            return response()->json(['success' => false, 'message' => 'Phone already registered'], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $phone,
            'email' => $validated['email'] ?? null,
            'password' => $validated['password'],
            'phone_verified_at' => now(),
            'is_active' => true,
        ]);

        $clientRole = Role::where('name', 'client')->first();
        if ($clientRole) {
            $user->roles()->attach($clientRole->id);
        }

        $this->linkRequestsByPhone($user);

        $token = $user->createToken('client-portal')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['token' => $token, 'user' => $this->userPayload($user)],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required_without_all:email,phone|string|max:50',
            'phone' => 'required_without_all:email,username|nullable|string|max:20',
            'email' => 'required_without_all:phone,username|nullable|email',
            'password' => 'required|string',
        ]);

        if (! empty($validated['username'])) {
            $user = User::where('username', $validated['username'])->first();
        } elseif (! empty($validated['email'])) {
            $user = User::where('email', $validated['email'])->first();
        } else {
            $user = User::where('phone', PhoneFormatter::toE164($validated['phone']))->first();
        }

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['success' => false, 'message' => 'Account deactivated'], 403);
        }

        if ($user->two_factor_confirmed_at && $user->roles()->whereNotIn('name', ['client'])->exists()) {
            $tempToken = Str::random(64);
            Cache::put("2fa:{$tempToken}", $user->id, now()->addMinutes(5));

            return response()->json([
                'success' => true,
                'data' => ['requires_2fa' => true, 'temp_token' => $tempToken],
            ]);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken($this->tokenName($user))->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['token' => $token, 'user' => $this->userPayload($user)],
        ]);
    }

    public function requestOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
            'context' => 'nullable|in:login,register',
        ]);

        $result = $this->otpService->send($validated['phone'], $validated['context'] ?? 'login');

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'] ?? ($result['success'] ? 'OTP sent' : 'Failed'),
        ], $result['success'] ? 200 : 422);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
            'otp' => 'required|string|size:6',
            'context' => 'nullable|in:login,register',
            'name' => 'required_if:context,register|string|max:255',
        ]);

        $phone = PhoneFormatter::toE164($validated['phone']);
        if (! $phone || ! $this->otpService->verify($validated['phone'], $validated['otp'], $validated['context'] ?? 'login')) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP'], 401);
        }

        $user = User::where('phone', $phone)->first();

        if (! $user && ($validated['context'] ?? 'login') === 'register') {
            $user = User::create([
                'name' => $validated['name'] ?? 'IPS Client',
                'phone' => $phone,
                'phone_verified_at' => now(),
                'is_active' => true,
            ]);
            $clientRole = Role::where('name', 'client')->first();
            if ($clientRole) {
                $user->roles()->attach($clientRole->id);
            }
        }

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'No account found. Please register first.'], 404);
        }

        $user->update(['phone_verified_at' => now(), 'last_login_at' => now()]);
        $this->linkRequestsByPhone($user);

        $token = $user->createToken('client-portal-otp')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['token' => $token, 'user' => $this->userPayload($user)],
        ]);
    }

    public function verify2fa(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'temp_token' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $userId = Cache::get("2fa:{$validated['temp_token']}");
        if (! $userId) {
            return response()->json(['success' => false, 'message' => 'Session expired'], 401);
        }

        $user = User::find($userId);
        if (! $user || ! $user->two_factor_secret) {
            return response()->json(['success' => false, 'message' => '2FA not configured'], 400);
        }

        $google2fa = new Google2FA;
        if (! $google2fa->verifyKey(decrypt($user->two_factor_secret), $validated['code'])) {
            return response()->json(['success' => false, 'message' => 'Invalid 2FA code'], 401);
        }

        Cache::forget("2fa:{$validated['temp_token']}");
        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('admin-portal')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['token' => $token, 'user' => $this->userPayload($user)],
        ]);
    }

    public function setup2fa(Request $request): JsonResponse
    {
        $user = $request->user();
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey();

        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_confirmed_at' => null,
        ]);

        $qrUrl = $google2fa->getQRCodeUrl(config('app.name'), $user->email ?? $user->phone, $secret);

        return response()->json([
            'success' => true,
            'data' => ['secret' => $secret, 'qr_url' => $qrUrl],
        ]);
    }

    public function confirm2fa(Request $request): JsonResponse
    {
        $validated = $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();

        if (! $user->two_factor_secret) {
            return response()->json(['success' => false, 'message' => 'Run 2FA setup first'], 400);
        }

        $google2fa = new Google2FA;
        if (! $google2fa->verifyKey(decrypt($user->two_factor_secret), $validated['code'])) {
            return response()->json(['success' => false, 'message' => 'Invalid code'], 422);
        }

        $user->update(['two_factor_confirmed_at' => now()]);

        return response()->json(['success' => true, 'message' => '2FA enabled']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->userPayload($request->user()->load('roles')),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['success' => true, 'message' => 'Logged out']);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->roles->pluck('name'),
            'has_2fa' => (bool) $user->two_factor_confirmed_at,
        ];
    }

    private function tokenName(User $user): string
    {
        return $user->hasRole('client') ? 'client-portal' : 'admin-portal';
    }

    private function linkRequestsByPhone(User $user): void
    {
        if (! $user->phone) {
            return;
        }

        \App\Models\ServiceRequest::where('client_phone', $user->phone)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id]);
    }
}
