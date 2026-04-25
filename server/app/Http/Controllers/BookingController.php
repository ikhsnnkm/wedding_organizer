<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use App\Models\VendorRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;

class BookingController extends Controller
{
    public function __construct()
    {
        MidtransConfig::$serverKey    = config('services.midtrans.server_key');
        MidtransConfig::$isProduction = config('services.midtrans.is_production');
        MidtransConfig::$isSanitized  = config('services.midtrans.is_sanitized');
        MidtransConfig::$is3ds        = config('services.midtrans.is_3ds');
    }

    // GET /api/bookings/my
    public function my(Request $request): JsonResponse
    {
        $bookings = Booking::with(['package', 'vendor', 'payments', 'vendorRequests.vendor'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->get();
        return response()->json(['data' => $bookings]);
    }

    // GET /api/bookings/{id}
    public function show(Request $request, Booking $booking): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()
            && $booking->customer_id !== $user->id
            && $booking->vendor?->user_id !== $user->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }
        return response()->json([
            'data' => $booking->load(['customer', 'vendor', 'package', 'payments', 'vendorRequests.vendor']),
        ]);
    }

    // POST /api/bookings
    // PERUBAHAN: vendor_id = null (dipilih admin), tambah location & konsep
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            // Terima package_id (ID numerik) ATAU tier_id (silver/gold/platinum)
            'package_id'    => 'required_without:tier_id|nullable|exists:packages,id',
            'tier_id'       => 'required_without:package_id|nullable|in:silver,gold,platinum',
            'pemesan_name'  => 'required|string|max:255',
            'pemesan_email' => 'required|email',
            'pemesan_phone' => 'required|string|regex:/^08\d{8,11}$/',
            'wedding_date'  => 'required|date|after:today',
            'location'      => 'required|string|max:255',
            'konsep'        => 'required|string|max:255',
            'notes'         => 'sometimes|nullable|string',
        ]);

        // Cari package by ID atau by tier_id
        if ($request->package_id) {
            $package = Package::findOrFail($request->package_id);
        } else {
            $package = Package::where('tier_id', $request->tier_id)
                              ->where('is_active', true)
                              ->firstOrFail();
        }
        $dp      = (int) round($package->price * 0.3);

        $booking = Booking::create([
            'order_id'      => Booking::generateOrderId(),
            'customer_id'   => $request->user()->id,
            'vendor_id'     => null,
            'package_id'    => $package->id,
            'pemesan_name'  => $request->pemesan_name,
            'pemesan_email' => $request->pemesan_email,
            'pemesan_phone' => $request->pemesan_phone,
            'wedding_date'  => $request->wedding_date,
            'location'      => $request->location,
            'konsep'        => $request->konsep,
            'notes'         => $request->notes,
            'total_price'   => $package->price,
            'status'        => 'pending',
            'phase'         => 'pending',
            'admin_status'  => 'waiting_payment',
        ]);

        return response()->json([
            'message' => 'Booking berhasil dibuat. Lanjutkan ke pembayaran.',
            'data'    => $booking->load('package'),
        ], 201);
    }

    // POST /api/bookings/{id}/pay-dp
    // Customer bayar DP 30%
    public function payDp(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }
        if ($booking->isDpPaid()) {
            return response()->json(['message' => 'DP sudah dibayar.'], 422);
        }
        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking sudah dibatalkan.'], 422);
        }

        $amount = $booking->dp_amount;   // 30% dari total

        $snapToken = Snap::getSnapToken([
            'transaction_details' => [
                'order_id'     => $booking->order_id . '-DP-' . time(),
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $booking->pemesan_name,
                'email'      => $booking->pemesan_email,
                'phone'      => $booking->pemesan_phone,
            ],
            'item_details' => [[
                'id'       => 'dp-' . $booking->id,
                'price'    => $amount,
                'quantity' => 1,
                'name'     => 'DP 30% Paket ' . ucfirst($booking->package->tier_id ?? '') . ' — AMARANTA',
            ]],
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'type'       => 'dp',
            'amount'     => $amount,
            'status'     => 'pending',
            'snap_token' => $snapToken,
        ]);

        return response()->json([
            'snap_token' => $snapToken,
            'client_key' => config('services.midtrans.client_key'),
            'amount'     => $amount,
            'type'       => 'dp',
        ]);
    }

    // POST /api/bookings/{id}/pay-full
    // Customer bayar pelunasan 70% — hanya setelah preparation
    public function payFull(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }
        if (!$booking->isDpPaid()) {
            return response()->json(['message' => 'DP belum dibayar.'], 422);
        }
        if ($booking->isFullPaid()) {
            return response()->json(['message' => 'Pembayaran sudah lunas.'], 422);
        }
        if ($booking->admin_status !== 'preparation') {
            return response()->json([
                'message' => 'Pelunasan belum bisa dilakukan. Tunggu admin mengkonfirmasi persiapan acara.',
                'current_status' => $booking->admin_status,
            ], 422);
        }

        $amount = $booking->remaining_amount;   // 70%

        $snapToken = Snap::getSnapToken([
            'transaction_details' => [
                'order_id'     => $booking->order_id . '-FULL-' . time(),
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $booking->pemesan_name,
                'email'      => $booking->pemesan_email,
                'phone'      => $booking->pemesan_phone,
            ],
            'item_details' => [[
                'id'       => 'full-' . $booking->id,
                'price'    => $amount,
                'quantity' => 1,
                'name'     => 'Pelunasan 70% Paket ' . ucfirst($booking->package->tier_id ?? '') . ' — AMARANTA',
            ]],
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'type'       => 'full',
            'amount'     => $amount,
            'status'     => 'pending',
            'snap_token' => $snapToken,
        ]);

        return response()->json([
            'snap_token' => $snapToken,
            'client_key' => config('services.midtrans.client_key'),
            'amount'     => $amount,
            'type'       => 'full',
        ]);
    }

    // PATCH /api/bookings/{id}/cancel
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        if (!in_array($booking->admin_status, ['waiting_dp', 'waiting_payment', 'payment_failed'])) {
            return response()->json([
                'message' => 'Booking tidak bisa dibatalkan setelah pembayaran diproses.',
            ], 422);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking sudah dibatalkan.'], 422);
        }

        $booking->update([
            'status'       => 'cancelled',
            'admin_status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Booking berhasil dibatalkan.',
            'data'    => $booking->fresh(),
        ]);
    }

    // POST /api/bookings/{id}/rate
    public function rate(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        if ($booking->phase !== 'in_event') {
            return response()->json(['message' => 'Penilaian hanya bisa diberikan setelah acara berlangsung.'], 422);
        }

        if ($booking->rating) {
            return response()->json(['message' => 'Anda sudah memberikan penilaian.'], 422);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'sometimes|nullable|string|max:1000',
        ]);

        $booking->update([
            'rating'   => $request->rating,
            'review'   => $request->review,
            'rated_at' => now(),
            'phase'    => 'rated',
            'admin_status' => 'completed',
            'status'   => 'completed',
        ]);

        return response()->json([
            'message' => 'Terima kasih atas penilaian Anda!',
            'data'    => $booking->fresh(),
        ]);
    }

    // GET /api/bookings/booked-dates
    public function bookedDates(): JsonResponse
    {
        $dates = Booking::whereNotIn('status', ['cancelled'])
            ->whereNotNull('wedding_date')
            ->pluck('wedding_date')
            ->map(fn($d) => $d instanceof \Carbon\Carbon ? $d->format('Y-m-d') : substr($d, 0, 10))
            ->unique()
            ->values();

        return response()->json(['data' => $dates]);
    }

    // GET /api/bookings/vendor
    public function vendorInbox(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;
        if (!$vendor) {
            return response()->json(['message' => 'Akun ini tidak memiliki profil vendor.'], 403);
        }

        $requests = VendorRequest::with([
            'booking.customer',
            'booking.package',
            'booking.payments',
            'assignedBy',
        ])
            ->where('vendor_id', $vendor->id)
            ->latest()
            ->get();

        return response()->json(['data' => $requests]);
    }

}