<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReferenceNumberService
{
    public function generate(string $type, string $prefix): string
    {
        $year = (int) date('Y');

        return DB::transaction(function () use ($type, $prefix, $year) {
            $counter = DB::table('reference_counters')
                ->where('type', $type)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if ($counter) {
                $next = $counter->last_number + 1;
                DB::table('reference_counters')
                    ->where('id', $counter->id)
                    ->update(['last_number' => $next, 'updated_at' => now()]);
            } else {
                $next = 1;
                DB::table('reference_counters')->insert([
                    'type' => $type,
                    'year' => $year,
                    'last_number' => $next,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return sprintf('%s-%d-%06d', $prefix, $year, $next);
        });
    }
}
