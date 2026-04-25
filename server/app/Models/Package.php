<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = ['vendor_id', 'tier_id', 'price', 'max_guests', 'is_active'];

    protected function casts(): array
    {
        return [
            'price', 'max_guests'     => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    // Label tier yang ramah tampilan
    public function getTierLabelAttribute(): string
    {
        return ucfirst($this->tier_id);
    }
}