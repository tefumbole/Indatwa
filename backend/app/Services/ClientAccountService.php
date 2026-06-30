<?php

namespace App\Services;

use App\Models\Role;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\PhoneFormatter;
use Illuminate\Support\Str;

class ClientAccountService
{
    public function ensureForRequest(ServiceRequest $request): User
    {
        $phone = PhoneFormatter::toE164($request->client_phone);
        if (! $phone) {
            throw new \InvalidArgumentException('Invalid client phone');
        }

        $user = User::where('phone', $phone)->first();
        if ($user) {
            if (! $request->user_id) {
                $request->update(['user_id' => $user->id]);
            }

            return $user;
        }

        $username = $this->uniqueUsername($phone);
        $password = 'system';

        $user = User::create([
            'name' => $request->client_name,
            'username' => $username,
            'phone' => $phone,
            'email' => $request->client_email,
            'password' => $password,
            'phone_verified_at' => now(),
            'is_active' => true,
        ]);

        $clientRole = Role::where('name', 'client')->first();
        if ($clientRole) {
            $user->roles()->attach($clientRole->id);
        }

        $request->update(['user_id' => $user->id]);

        return $user;
    }

    public function issueQuotationToken(ServiceRequest $request): string
    {
        $token = Str::random(64);
        $request->update(['quotation_access_token' => $token]);

        return $token;
    }

    private function uniqueUsername(string $phone): string
    {
        $base = 'client'.preg_replace('/\D/', '', $phone);
        $username = $base;
        $i = 1;
        while (User::where('username', $username)->exists()) {
            $username = $base.$i;
            $i++;
        }

        return $username;
    }
}
