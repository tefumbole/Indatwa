<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'reference_number', 'user_id', 'status',
        'client_name', 'client_nationality', 'client_country', 'client_city',
        'client_phone', 'client_email',
        'event_title', 'event_type', 'event_date', 'event_start_date', 'event_end_date',
        'event_start_time', 'event_end_time',
        'number_of_guests', 'venue', 'event_description',
        'signature_path', 'pdf_path', 'tracking_token',
        'assigned_to', 'reviewed_by', 'reviewed_at',
        'admin_notes', 'client_notes', 'quoted_amount', 'quotation_notes', 'quotation_sent_at',
        'submitted_at',
    ];

    protected $casts = [
        'event_date' => 'date',
        'event_start_date' => 'date',
        'event_end_date' => 'date',
        'reviewed_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(ServiceRequestItem::class);
    }

    public function documents()
    {
        return $this->hasMany(ServiceRequestDocument::class);
    }

    public function messages()
    {
        return $this->hasMany(ServiceRequestMessage::class);
    }
}
