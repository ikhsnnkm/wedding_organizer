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
            'message' => 'Booking berhasil dibuat. Lanjutkan pembayaran DP.',
            'data'    => $booking->load('package'),
        ], 201);
    }

    // POST /api/bookings/{id}/pay
    // Pembayaran langsung LUNAS — tidak ada DP
    public function pay(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        // Sudah dibayar
        if ($booking->isPaid()) {
            return response()->json(['message' => 'Booking ini sudah dibayar lunas.'], 422);
        }

        $amount = $booking->total_price;   // langsung full

        $snapToken = Snap::getSnapToken([
            'transaction_details' => [
                'order_id'      => $booking->order_id . '-PAY-' . time(),
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $booking->pemesan_name,
                'email'      => $booking->pemesan_email,
                'phone'      => $booking->pemesan_phone,
            ],
            'item_details' => [[
                'id'       => 'pay-' . $booking->id,
                'price'    => $amount,
                'quantity' => 1,
                'name'     => 'Paket ' . ucfirst($booking->package->tier_id ?? '') . ' — AMARANTA',
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
        ]);
    }

    // POST /api/bookings/{id}/rate
    public function rate(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }
        if (!$booking->isFullPaid()) {
            return response()->json(['message' => 'Belum bisa memberi rating sebelum lunas.'], 422);
        }
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'sometimes|string|max:1000',
        ]);
        $booking->update([
            'rating' => $request->rating, 'review' => $request->review,
            'rated_at' => now(), 'phase' => 'rated', 'status' => 'completed',
        ]);
        $booking->vendor?->recalculateRating();
        return response()->json(['message' => 'Rating berhasil dikirim.']);
    }

    // GET /api/bookings/vendor
    // Vendor melihat vendor_requests yang masuk ke mereka (bukan seluruh bookings)
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

    // POST /api/payment/notify — Webhook Midtrans
    public function midtransNotify(Request $request): JsonResponse
    {
        $notif   = new \Midtrans\Notification();
        $orderId = $notif->order_id;
        $status  = $notif->transaction_status;
        $type    = $notif->payment_type;

        preg_match('/^(AMRT-[A-Z0-9]+)-(DP|FULL)-/', $orderId, $m);
        if (empty($m)) return response()->json(['ok' => false]);

        $booking = Booking::where('order_id', $m[1])->first();
        if (!$booking) return response()->json(['ok' => false]);

        $paymentType = strtolower($m[2]);
        $payment = Payment::where('booking_id', $booking->id)
                          ->where('type', $paymentType)
                          ->where('status', 'pending')
                          ->latest()->first();

        if (in_array($status, ['settlement', 'capture'])) {
            $payment?->update([
                'status' => 'success', 'payment_type' => $type,
                'transaction_id' => $notif->transaction_id,
                'paid_at' => now(), 'midtrans_response' => (array) $notif,
            ]);

            // Pembayaran lunas
                $booking->update([
                    'phase'          => 'paid',
                    'paid_at'        => now(),
                    'payment_method' => $type,
                    'status'         => 'confirmed',
                    'admin_status'   => 'waiting_vendor',
                ]);
        } elseif (in_array($status, ['cancel', 'deny', 'expire'])) {
            $payment?->update(['status' => 'failed']);
            $booking->update(['admin_status' => 'payment_failed']);
        }

        return response()->json(['ok' => true]);
    }

    // Customer ubah tanggal — hanya boleh sebelum vendor confirmed
    public function reschedule(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        // Hanya boleh reschedule sebelum vendor confirmed
        $lockedStatuses = ['vendor_confirmed','tech_meeting_scheduled','preparation','in_event','completed'];
        if (in_array($booking->admin_status, $lockedStatuses)) {
            return response()->json([
                'message' => 'Tanggal tidak bisa diubah setelah vendor dikonfirmasi.',
            ], 422);
        }

        $request->validate([
            'wedding_date' => 'required|date|after:today',
            'reason'       => 'sometimes|nullable|string|max:500',
        ]);

        $booking->update([
            'wedding_date' => $request->wedding_date,
            'admin_notes'  => $booking->admin_notes . ($request->reason
                ? "\n[Reschedule] " . $request->reason : ''),
        ]);

        return response()->json([
            'message' => 'Tanggal berhasil diubah ke ' . $request->wedding_date,
            'data'    => $booking->fresh(),
        ]);
    }

    // PATCH /api/bookings/{id}/cancel
    // Customer batalkan booking — hanya sebelum bayar
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        // Hanya bisa batalkan jika belum bayar
        if (!in_array($booking->admin_status, ['waiting_dp', 'payment_failed'])) {
            return response()->json([
                'message' => 'Booking tidak bisa dibatalkan setelah pembayaran diproses.',
            ], 422);
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

    // GET /api/bookings/booked-dates
    // Kembalikan array tanggal yang sudah dipesan (tidak bisa dipilih lagi)
    // Hanya tanggal dengan status aktif (bukan cancelled)
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

}