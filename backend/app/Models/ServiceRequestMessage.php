<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestMessage extends Model
{
    protected $fillable = [
        'service_request_id', 'sender_id', 'message', 'is_internal',
    ];

    protected $casts = ['is_internal' => 'boolean'];

    public function serviceRequest()
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
