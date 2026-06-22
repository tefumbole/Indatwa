<?php

namespace App\Support;

class PhoneFormatter
{
    public static function toE164(?string $phone, string $defaultCountryCode = '250'): ?string
    {
        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (! $digits) {
            return null;
        }

        if (str_starts_with($digits, $defaultCountryCode)) {
            return '+'.$digits;
        }

        if (str_starts_with($digits, '0')) {
            return '+'.$defaultCountryCode.substr($digits, 1);
        }

        if (strlen($digits) === 9) {
            return '+'.$defaultCountryCode.$digits;
        }

        return '+'.$digits;
    }

    public static function isValid(?string $phone): bool
    {
        $formatted = self::toE164($phone);

        return $formatted !== null && strlen($formatted) >= 10;
    }
}
