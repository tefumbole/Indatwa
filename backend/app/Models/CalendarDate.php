<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarDate extends Model
{
    protected $fillable = [
        'date', 'is_booked', 'service_request_id', 'label', 'notes', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'is_booked' => 'boolean',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
