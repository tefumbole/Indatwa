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
        'signature_path', 'pdf_path', 'tracking_token', 'quotation_access_token',
        'assigned_to', 'reviewed_by', 'reviewed_at',
        'admin_notes', 'client_notes', 'quoted_amount', 'miscellaneous_amount', 'quotation_notes', 'quotation_sent_at',
        'sent_for_signature_at', 'client_signed_at', 'agreement_accepted', 'agreement_accepted_at',
        'profile_completed_at', 'submitted_at',
    ];

    protected $casts = [
        'event_date' => 'date',
        'event_start_date' => 'date',
        'event_end_date' => 'date',
        'reviewed_at' => 'datetime',
        'submitted_at' => 'datetime',
        'quotation_sent_at' => 'datetime',
        'sent_for_signature_at' => 'datetime',
        'client_signed_at' => 'datetime',
        'agreement_accepted' => 'boolean',
        'agreement_accepted_at' => 'datetime',
        'profile_completed_at' => 'datetime',
        'miscellaneous_amount' => 'decimal:2',
        'quoted_amount' => 'decimal:2',
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
