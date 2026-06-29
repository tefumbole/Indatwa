<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementTemplate extends Model
{
    protected $fillable = [
        'name', 'category', 'subject', 'header', 'body', 'footer', 'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
