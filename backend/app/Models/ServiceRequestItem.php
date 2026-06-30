<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestItem extends Model
{
    protected $fillable = [
        'service_request_id', 'service_id', 'service_name',
        'status', 'client_status', 'client_responded_at',
        'admin_comment', 'quoted_price', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'client_responded_at' => 'datetime',
        'quoted_price' => 'decimal:2',
    ];

    public function serviceRequest()
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
