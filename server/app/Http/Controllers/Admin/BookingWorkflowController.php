<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Vendor;
use App\Models\VendorRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookingWorkflowController extends Controller
{
    // PATCH /api/admin/bookings/{booking}/assign-vendor
    public function assignVendor(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'vendor_id'   => 'required|exists:vendors,id',
            'admin_notes' => 'sometimes|nullable|string',
        ]);

        $vendor = Vendor::findOrFail($request->vendor_id);

        // Buat vendor request baru
        VendorRequest::create([
            'booking_id'  => $booking->id,
            'vendor_id'   => $vendor->id,
            'assigned_by' => $request->user()->id,
            'status'      => 'pending',
        ]);

        $booking->update([
            'vendor_id'          => $vendor->id,
            'admin_status'       => 'vendor_assigned',
            'vendor_assigned_at' => now(),
            'admin_notes'        => $request->admin_notes,
        ]);

        return response()->json([
            'message' => 'Vendor berhasil di-assign.',
            'data'    => $booking->fresh(['vendor', 'vendorRequests.vendor']),
        ]);
    }

    // PATCH /api/admin/bookings/{booking}/reassign-vendor
    public function reassignVendor(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
        ]);

        $vendor = Vendor::findOrFail($request->vendor_id);

        VendorRequest::create([
            'booking_id'  => $booking->id,
            'vendor_id'   => $vendor->id,
            'assigned_by' => $request->user()->id,
            'status'      => 'pending',
        ]);

        $booking->update([
            'vendor_id'          => $vendor->id,
            'admin_status'       => 'vendor_assigned',
            'vendor_assigned_at' => now(),
        ]);

        return response()->json([
            'message' => 'Vendor baru berhasil di-assign.',
            'data'    => $booking->fresh(['vendor', 'vendorRequests.vendor']),
        ]);
    }

    // POST /api/admin/bookings/{booking}/tech-meeting
    public function setTechMeeting(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'tech_meeting_at'       => 'required|date|after:now',
            'tech_meeting_location' => 'required|string|max:255',
            'tech_meeting_notes'    => 'sometimes|nullable|string',
        ]);

        $booking->update([
            'tech_meeting_at'       => $request->tech_meeting_at,
            'tech_meeting_location' => $request->tech_meeting_location,
            'tech_meeting_notes'    => $request->tech_meeting_notes,
            'admin_status'          => 'tech_meeting_scheduled',
        ]);

        return response()->json([
            'message' => 'Tech meeting dijadwalkan.',
            'data'    => $booking->fresh(),
        ]);
    }

    // PATCH /api/admin/bookings/{booking}/confirm-tech-meeting
    public function confirmTechMeeting(Request $request, Booking $booking): JsonResponse
    {
        $booking->update([
            'tech_meeting_confirmed' => true,
            'admin_status'           => 'preparation',
        ]);

        return response()->json([
            'message' => 'Tech meeting dikonfirmasi. Persiapan dimulai.',
            'data'    => $booking->fresh(),
        ]);
    }

    // PATCH /api/admin/bookings/{booking}/preparation
    public function updatePreparation(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'preparation_progress' => 'required|integer|min:0|max:100',
            'catatan'              => 'required|string|min:10',
        ]);

        $lastProgress = $booking->preparation_progress ?? 0;
        $isRevision   = $request->preparation_progress < $lastProgress;

        // Simpan ke log
        \App\Models\BookingProgressLog::create([
            'booking_id'  => $booking->id,
            'admin_id'    => $request->user()->id,
            'progress'    => $request->preparation_progress,
            'catatan'     => $request->catatan,
            'is_revision' => $isRevision,
            'created_at'  => now(),
        ]);

        $booking->update([
            'preparation_progress' => $request->preparation_progress,
        ]);

        return response()->json([
            'message' => 'Progress diperbarui: ' . $request->preparation_progress . '%',
            'data'    => $booking->fresh(['progressLogs.admin']),
        ]);
    }

    // PATCH /api/admin/bookings/{booking}/execute-event
    public function markEventExecuted(Request $request, Booking $booking): JsonResponse
    {
        if (!$booking->isPaid()) {
            return response()->json([
                'message' => 'Acara tidak bisa dieksekusi. Pembayaran belum lunas.',
            ], 422);
        }

        $booking->update([
            'admin_status' => 'in_event',
            'phase'        => 'in_event',
            'status'       => 'confirmed',
        ]);

        return response()->json([
            'message' => 'Acara ditandai sedang berlangsung.',
            'data'    => $booking->fresh(),
        ]);
    }

    // PATCH /api/admin/bookings/{id}/mark-paid
    // Admin tandai booking sudah dibayar (manual, untuk development)
    // Di production, ini dilakukan otomatis oleh Midtrans webhook
    public function markPaid(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->isPaid()) {
            return response()->json(['message' => 'Booking sudah dibayar.'], 422);
        }

        $booking->update([
            'phase'        => 'paid',
            'paid_at'      => now(),
            'status'       => 'confirmed',
            'admin_status' => 'waiting_vendor',
        ]);

        return response()->json([
            'message' => 'Booking ditandai sudah dibayar.',
            'data'    => $booking->fresh(),
        ]);
    }

    // GET /api/admin/bookings/{booking}/progress-log
    public function progressLog(Request $request, Booking $booking): JsonResponse
    {
        $logs = $booking->progressLogs()
            ->with('admin:id,name')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($l) => [
                'progress'   => $l->progress,
                'catatan'    => $l->catatan,
                'is_revision'=> $l->is_revision,
                'updated_by' => $l->admin->name ?? 'Admin',
                'created_at' => $l->created_at->format('Y-m-d H:i'),
            ]);

        return response()->json(['data' => $logs]);
    }

    // PATCH /api/admin/bookings/{booking}/mark-paid
    // PATCH /api/admin/bookings/{booking}/confirm-dp-payment
    // Admin konfirmasi pembayaran DP → lanjut ke proses vendor
    public function confirmDpPayment(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->admin_status !== 'dp_confirm_pending') {
            return response()->json(['message' => 'Tidak ada pembayaran DP yang perlu dikonfirmasi.'], 422);
        }
        $booking->update(['admin_status' => 'waiting_vendor']);
        return response()->json([
            'message' => 'Pembayaran DP dikonfirmasi. Silakan assign vendor.',
            'data'    => $booking->fresh(),
        ]);
    }

    // PATCH /api/admin/bookings/{booking}/confirm-full-payment
    // Admin konfirmasi pelunasan → booking siap eksekusi
    public function confirmFullPayment(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->admin_status !== 'full_confirm_pending') {
            return response()->json(['message' => 'Tidak ada pelunasan yang perlu dikonfirmasi.'], 422);
        }
        $booking->update(['admin_status' => 'preparation']);
        return response()->json([
            'message' => 'Pelunasan dikonfirmasi. Booking siap dieksekusi.',
            'data'    => $booking->fresh(),
        ]);
    }

}