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
        ]);

        $booking->update([
            'preparation_progress' => $request->preparation_progress,
        ]);

        return response()->json([
            'message' => 'Progress diperbarui: ' . $request->preparation_progress . '%',
            'data'    => $booking->fresh(),
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
}