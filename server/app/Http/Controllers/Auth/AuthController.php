<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\User;
use App\Mail\OtpMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── POST /api/auth/login ─────────────────────────────────
    // Body: { email, password }
    // Return: { token, user }
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        if (!$user->isVerified()) {
            return response()->json([
                'message' => 'Email belum diverifikasi. Cek email Anda.',
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun Anda dinonaktifkan. Hubungi admin.',
            ], 403);
        }

        // Hapus token lama, buat token baru
        $user->tokens()->delete();
        $token = $user->createToken('amaranta-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ]);
    }

    // ── POST /api/auth/register ──────────────────────────────
    // Body: { name, email, phone, username, password, role }
    // Return: { message } — lalu kirim OTP ke email
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'required|string|regex:/^08\d{8,11}$/',
            'password' => 'required|string|min:8',
            // username auto-generate dari email, tidak perlu dari form
            // role opsional, default customer
        ], [
            // Pesan error dalam Bahasa Indonesia
            'email.unique'     => 'Email sudah terdaftar.',
            // username auto-generated
            'phone.regex'      => 'Format HP tidak valid (contoh: 081234567890).',
            'username.regex'   => 'Username hanya boleh huruf, angka, dan underscore.',
            'password.min'     => 'Password minimal 8 karakter.',
        ]);

        // Simpan user sebagai belum terverifikasi
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'username' => explode('@', $request->email)[0] . '_' . rand(100, 999),
            'role'     => 'customer',   // SELALU customer — vendor hanya dibuat oleh admin
            'password' => $request->password,
        ]);

        // Generate & kirim OTP ke email
        $code = OtpCode::generate($request->email, 'register');

        // Kirim email OTP (non-blocking)
        Mail::to($request->email)->send(new OtpMail($code, $user->name));

        return response()->json([
            'message' => 'Kode OTP dikirim ke ' . $request->email . '. Berlaku 5 menit.',
            'email'   => $request->email,
        ], 201);
    }

    // ── POST /api/auth/verify-otp ────────────────────────────
    // Body: { email, otp, purpose? }
    // Return: { token, user } jika OTP benar
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email'   => 'required|email',
            'otp'     => 'required|string|size:6',
            'purpose' => 'sometimes|in:register,reset_password,change_email',
        ]);

        $purpose = $request->purpose ?? 'register';
        $valid   = OtpCode::verify($request->email, $request->otp, $purpose);

        if (!$valid) {
            return response()->json([
                'message' => 'Kode OTP tidak valid atau sudah kadaluarsa.',
            ], 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        // Tandai email sebagai terverifikasi
        $user->update(['email_verified_at' => now()]);

        // Auto-login setelah verifikasi
        $token = $user->createToken('amaranta-token')->plainTextToken;

        return response()->json([
            'message' => 'Email berhasil diverifikasi.',
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ]);
    }

    // ── POST /api/auth/resend-otp ────────────────────────────
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 404);
        }

        $code = OtpCode::generate($request->email, 'register');
        Mail::to($request->email)->send(new OtpMail($code, $user->name));

        return response()->json([
            'message' => 'OTP baru dikirim ke ' . $request->email,
        ]);
    }

    // ── GET /api/auth/me ─────────────────────────────────────
    // Header: Authorization: Bearer {token}
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    // ── POST /api/auth/logout ────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    // ── POST /api/auth/forgot-password ──────────────────────
    // Body: { email }
    // Kirim OTP reset password ke email
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Selalu return 200 (jangan beri tahu apakah email terdaftar atau tidak)
        if (! $user) {
            return response()->json([
                'message' => 'Jika email terdaftar, kode reset telah dikirim.',
            ]);
        }

        $code = OtpCode::generate($request->email, 'reset_password');
        Mail::to($request->email)->send(new OtpMail($code, $user->name));

        return response()->json([
            'message' => 'Kode reset password dikirim ke email Anda.',
        ]);
    }

    // ── POST /api/auth/reset-password ───────────────────────
    // Body: { email, otp, new_password }
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'        => 'required|email',
            'otp'          => 'required|string|size:6',
            'new_password' => 'required|string|min:8',
        ]);

        $valid = OtpCode::verify($request->email, $request->otp, 'reset_password');

        if (! $valid) {
            return response()->json([
                'message' => 'Kode OTP tidak valid atau sudah kadaluarsa.',
            ], 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $user->update(['password' => $request->new_password]);

        return response()->json([
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ]);
    }

    // ── PUT /api/auth/profile ─────────────────────────────────
    // Body: { name?, phone?, username? }
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'phone'    => 'sometimes|string|regex:/^08\d{8,11}$/',
            'username' => 'sometimes|string|min:4|unique:users,username,' . $user->id,
        ]);

        $user->update($request->only(['name', 'phone', 'username']));

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $this->formatUser($user->fresh()),
        ]);
    }

    // ── PUT /api/auth/change-password ─────────────────────────
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Password saat ini tidak sesuai.',
            ], 422);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    // ── Helper: format data user ─────────────────────────────
    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'username'   => $user->username,
            'phone'      => $user->phone,
            'role'       => $user->role,
            'is_active'  => $user->is_active,
            'vendor_id'  => $user->vendor?->id,
        ];
    }
}