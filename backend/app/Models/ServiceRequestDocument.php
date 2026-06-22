<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestDocument extends Model
{
    protected $fillable = [
        'service_request_id', 'document_type', 'original_name',
        'file_path', 'mime_type', 'file_size', 'uploaded_by',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
