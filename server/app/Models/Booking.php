<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'order_id', 'customer_id', 'vendor_id', 'package_id',
        'pemesan_name', 'pemesan_email', 'pemesan_phone',
        'wedding_date', 'location', 'konsep', 'notes',
        'total_price', 'paid_at',          // tidak ada dp_amount / dp_paid_at
        'status', 'admin_status', 'phase',
        'payment_method', 'midtrans_order_id',
        'vendor_assigned_at', 'admin_notes',
        'tech_meeting_at', 'tech_meeting_location',
        'tech_meeting_notes', 'tech_meeting_confirmed',
        'preparation_progress',
        'rating', 'review', 'rated_at',
    ];

    protected function casts(): array
    {
        return [
            'paid_at'                => 'datetime',
            'vendor_assigned_at'     => 'datetime',
            'tech_meeting_at'        => 'datetime',
            'tech_meeting_confirmed' => 'boolean',
            'rated_at'               => 'datetime',
            'total_price'            => 'integer',
            'preparation_progress'   => 'integer',
            'rating'                 => 'integer',
        ];
    }

    // ── Relasi ──────────────────────────────────────────────
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function vendorRequests(): HasMany
    {
        return $this->hasMany(VendorRequest::class);
    }

    // ── Helpers ─────────────────────────────────────────────
    // Sudah dibayar lunas
    public function isPaid(): bool
    {
        return !is_null($this->paid_at);
    }

    // Belum dibayar
    public function isUnpaid(): bool
    {
        return is_null($this->paid_at);
    }

    // Admin bisa proses booking ini
    public function canAdminProcess(): bool
    {
        return $this->isPaid();
    }

    // Bisa eksekusi acara (sudah bayar dan vendor confirmed)
    public function canExecuteEvent(): bool
    {
        return $this->isPaid() &&
               $this->vendorRequests()->where('status', 'confirmed')->exists();
    }

    // Generate order ID unik: AMRT-XXXXXXXX
    public static function generateOrderId(): string
    {
        do {
            $id = 'AMRT-' . strtoupper(substr(md5(uniqid()), 0, 8));
        } while (static::where('order_id', $id)->exists());

        return $id;
    }
}