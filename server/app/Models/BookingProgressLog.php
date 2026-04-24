<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingProgressLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['booking_id', 'admin_id', 'progress', 'catatan', 'is_revision', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime', 'is_revision' => 'boolean'];
    }

    public function booking(): BelongsTo { return $this->belongsTo(Booking::class); }
    public function admin(): BelongsTo   { return $this->belongsTo(User::class, 'admin_id'); }
}