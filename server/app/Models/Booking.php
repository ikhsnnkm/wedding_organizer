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
        'total_price', 'dp_amount',
        'dp_paid_at', 'full_paid_at', 'paid_at',
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
            'dp_paid_at'             => 'datetime',
            'full_paid_at'           => 'datetime',
            'paid_at'                => 'datetime',
            'vendor_assigned_at'     => 'datetime',
            'tech_meeting_at'        => 'datetime',
            'tech_meeting_confirmed' => 'boolean',
            'rated_at'               => 'datetime',
            'total_price'            => 'integer',
            'dp_amount'              => 'integer',
            'preparation_progress'   => 'integer',
            'rating'                 => 'integer',
        ];
    }

    // ── Relasi ──────────────────────────────────────────────
    public function customer(): BelongsTo { return $this->belongsTo(User::class, 'customer_id'); }
    public function vendor(): BelongsTo   { return $this->belongsTo(Vendor::class); }
    public function package(): BelongsTo  { return $this->belongsTo(Package::class); }
    public function payments(): HasMany   { return $this->hasMany(Payment::class); }
    public function vendorRequests(): HasMany { return $this->hasMany(VendorRequest::class); }
    public function progressLogs(): HasMany   { return $this->hasMany(BookingProgressLog::class); }

    // ── Kalkulasi ────────────────────────────────────────────
    public function getDpAmountAttribute($val): int
    {
        if ($val) return (int) $val;
        return (int) round($this->total_price * 0.3);   // 30%
    }

    public function getRemainingAmountAttribute(): int
    {
        return $this->total_price - $this->getDpAmountAttribute(null);
    }

    // ── Status helpers ───────────────────────────────────────
    public function isDpPaid(): bool    { return !is_null($this->dp_paid_at); }
    public function isFullPaid(): bool  { return !is_null($this->full_paid_at) || !is_null($this->paid_at); }
    public function isPaid(): bool      { return $this->isFullPaid(); }

    // Bisa bayar DP?
    public function canPayDp(): bool    { return !$this->isDpPaid() && $this->status !== 'cancelled'; }

    // Bisa bayar pelunasan? Harus DP lunas + sudah masuk preparation
    public function canPayFull(): bool
    {
        return $this->isDpPaid() && !$this->isFullPaid()
            && $this->admin_status === 'preparation';
    }

    // Admin bisa proses? Butuh DP terbayar
    public function canAdminProcess(): bool { return $this->isDpPaid(); }

    // Admin bisa execute event? Butuh full payment
    public function canExecuteEvent(): bool
    {
        return $this->isFullPaid()
            && $this->vendorRequests()->where('status', 'confirmed')->exists();
    }

    // Summary pembayaran untuk response API
    public function paymentSummary(): array
    {
        return [
            'total_price'        => $this->total_price,
            'dp_amount'          => $this->dp_amount,
            'dp_paid'            => $this->isDpPaid(),
            'dp_paid_at'         => $this->dp_paid_at?->format('Y-m-d H:i'),
            'remaining_amount'   => $this->remaining_amount,
            'remaining_paid'     => $this->isFullPaid(),
            'remaining_paid_at'  => $this->full_paid_at?->format('Y-m-d H:i'),
            'can_pay_dp'         => $this->canPayDp(),
            'can_pay_full'       => $this->canPayFull(),
        ];
    }

    public static function generateOrderId(): string
    {
        do { $id = 'AMRT-' . strtoupper(substr(md5(uniqid()), 0, 8)); }
        while (static::where('order_id', $id)->exists());
        return $id;
    }
}