<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class OtpCode extends Model
{
    public $timestamps = false;

    protected $fillable = ['email', 'code', 'purpose', 'expires_at', 'created_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at'    => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    // ── Static helpers ───────────────────────────────────────

    // Generate dan simpan OTP baru
    public static function generate(string $email, string $purpose = 'register'): string
    {
        // Hapus OTP lama untuk email ini
        static::where('email', $email)->where('purpose', $purpose)->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        static::create([
            'email'      => $email,
            'code'       => $code,
            'purpose'    => $purpose,
            'expires_at' => Carbon::now('UTC')->addMinutes(5),
            'created_at' => Carbon::now('UTC'),
        ]);

        return $code;
    }

    // Verifikasi OTP
    public static function verify(string $email, string $code, string $purpose = 'register'): bool
    {
        $otp = static::where('email', $email)
            ->where('code', $code)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->where('expires_at', '>', Carbon::now('UTC'))
            ->first();

        if (!$otp) return false;

        $otp->update(['used_at' => Carbon::now('UTC')]);
        return true;
    }
}