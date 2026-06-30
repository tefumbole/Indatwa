<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffTask extends Model
{
    protected $fillable = [
        'title', 'description', 'status', 'priority',
        'assigned_to', 'service_request_id', 'assigned_service_item_ids', 'hide_amounts',
        'created_by',
        'due_date', 'completed_at',
        'assignment_notified_at', 'last_reminder_at', 'last_reminder_type',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'assignment_notified_at' => 'datetime',
        'last_reminder_at' => 'datetime',
        'assigned_service_item_ids' => 'array',
        'hide_amounts' => 'boolean',
    ];

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
