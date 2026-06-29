<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceAssignment extends Model
{
    protected $fillable = [
        'service_request_id', 'assigned_user_ids',
        'start_date', 'end_date', 'start_time', 'end_time',
        'notes', 'created_by',
    ];

    protected $casts = [
        'assigned_user_ids' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
