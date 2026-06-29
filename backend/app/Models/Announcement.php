<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = [
        'reference', 'title', 'category', 'header', 'body', 'footer',
        'audience_type', 'recipients', 'status', 'whatsapp_status',
        'scheduled_at', 'sent_at', 'attachments', 'sent_count', 'failed_count',
        'send_results', 'created_by',
    ];

    protected $casts = [
        'recipients' => 'array',
        'attachments' => 'array',
        'send_results' => 'array',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
