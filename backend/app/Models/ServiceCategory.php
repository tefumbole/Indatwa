<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'icon', 'sort_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function services()
    {
        return $this->hasMany(Service::class, 'category_id');
    }
}
