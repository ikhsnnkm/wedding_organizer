<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\VendorRequestController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\BookingWorkflowController;
use Illuminate\Support\Facades\Route;

// ── PUBLIK ────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/verify-otp',      [AuthController::class, 'verifyOtp']);
    Route::post('/resend-otp',      [AuthController::class, 'resendOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
});

Route::get('/packages',          fn() => response()->json(['data' =>
    \App\Models\Package::where('is_active', true)->with('vendor')->get()
]));
Route::get('/packages/{tierId}', fn($t) => response()->json(['data' =>
    \App\Models\Package::where('tier_id', $t)->where('is_active', true)->firstOrFail()
]));

Route::get('/gallery', [GalleryController::class, 'index']);
Route::post('/payment/notify', [BookingController::class, 'midtransNotify']);

// Tanggal yang sudah dipesan
Route::get('/bookings/booked-dates', [BookingController::class, 'bookedDates']);

// Invoice publik — dapat diakses tanpa login dengan verifikasi
Route::get('/bookings/{booking}/invoice', [BookingController::class, 'invoicePublic']);

// ── PROTECTED ─────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',              [AuthController::class, 'me']);
    Route::post('/auth/logout',         [AuthController::class, 'logout']);
    Route::put('/auth/profile',         [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/vendors/my',      [VendorController::class, 'my']);
    Route::put('/vendors/{vendor}', [VendorController::class, 'update']);

    // Customer booking
    Route::get('/bookings/my',                    [BookingController::class, 'my']);
    Route::get('/bookings/vendor',                [BookingController::class, 'vendorInbox']);
    Route::get('/bookings/{booking}',             [BookingController::class, 'show']);
    Route::post('/bookings',                      [BookingController::class, 'store']);
    Route::post('/bookings/{booking}/pay-dp',     [BookingController::class, 'payDp']);
    Route::post('/bookings/{booking}/pay-full',   [BookingController::class, 'payFull']);
    Route::patch('/bookings/{booking}/cancel',    [BookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/rate',       [BookingController::class, 'rate']);
    Route::get('/bookings/{booking}/progress-log',[BookingWorkflowController::class, 'progressLog']);

    // Vendor confirm/reject
    Route::middleware('role:vendor')->group(function () {
        Route::post('/vendor-requests/{vendorRequest}/confirm', [VendorRequestController::class, 'confirm']);
        Route::post('/vendor-requests/{vendorRequest}/reject',  [VendorRequestController::class, 'reject']);
    });

    Route::post('/gallery',            [GalleryController::class, 'store']);
    Route::delete('/gallery/{gallery}', [GalleryController::class, 'destroy']);

    // ── ADMIN ──────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);

        Route::get('/users',           [AdminController::class, 'users']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);

        Route::get('/vendors',                    [AdminController::class, 'vendors']);
        Route::post('/vendors',                   [AdminController::class, 'createVendor']);
        Route::put('/vendors/{vendor}',           [AdminController::class, 'updateVendor']);
        Route::patch('/vendors/{vendor}/approve', [AdminController::class, 'approveVendor']);
        Route::patch('/vendors/{vendor}/reject',  [AdminController::class, 'rejectVendor']);
        Route::delete('/vendors/{vendor}',        [AdminController::class, 'deleteVendor']);

        Route::get('/bookings',                                    [AdminController::class, 'bookings']);
        Route::patch('/bookings/{booking}/mark-paid',              [BookingWorkflowController::class, 'markPaid']);
        Route::patch('/bookings/{booking}/assign-vendor',          [BookingWorkflowController::class, 'assignVendor']);
        Route::patch('/bookings/{booking}/reassign-vendor',        [BookingWorkflowController::class, 'reassignVendor']);
        Route::post('/bookings/{booking}/tech-meeting',            [BookingWorkflowController::class, 'setTechMeeting']);
        Route::patch('/bookings/{booking}/confirm-tech-meeting',   [BookingWorkflowController::class, 'confirmTechMeeting']);
        Route::patch('/bookings/{booking}/preparation',            [BookingWorkflowController::class, 'updatePreparation']);
        Route::get('/bookings/{booking}/progress-log',             [BookingWorkflowController::class, 'progressLog']);
        Route::patch('/bookings/{booking}/execute-event',          [BookingWorkflowController::class, 'markEventExecuted']);
    });
});