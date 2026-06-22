<?php

namespace App\Services\Wasender;

use App\Models\User;
use App\Support\PhoneFormatter;

class AdminPhoneService
{
    /** @return string[] E.164 phones */
    public function getAdminPhones(): array
    {
        $phones = [config('wasender.admin_phone')];

        $dbPhones = User::whereHas('roles', fn ($q) => $q->whereIn('name', [
            'super_admin', 'director', 'operations_manager', 'customer_service',
        ]))->whereNotNull('phone')->pluck('phone')->toArray();

        $normalized = [];
        foreach (array_merge($phones, $dbPhones) as $phone) {
            $e164 = PhoneFormatter::toE164($phone);
            if ($e164) {
                $normalized[$e164] = true;
            }
        }

        return array_keys($normalized);
    }
}
