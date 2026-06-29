<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementSetting extends Model
{
    protected $fillable = [
        'company_name', 'default_header', 'serial_prefix',
        'next_serial', 'serial_padding', 'timezone',
    ];

    public static function singleton(): self
    {
        return static::firstOrCreate([], [
            'company_name' => config('wasender.company_name'),
            'serial_prefix' => 'IPS/ANN',
            'next_serial' => 1,
            'serial_padding' => 6,
            'timezone' => 'Africa/Kigali',
        ]);
    }

    public function allocateReference(): string
    {
        $num = str_pad((string) $this->next_serial, $this->serial_padding, '0', STR_PAD_LEFT);
        $ref = "{$this->serial_prefix}-{$num}";
        $this->increment('next_serial');

        return $ref;
    }
}
