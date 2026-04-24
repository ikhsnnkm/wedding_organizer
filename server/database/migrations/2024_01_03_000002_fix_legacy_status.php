<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Fix data lama: ganti status waiting_dp → waiting_payment
return new class extends Migration
{
    public function up(): void
    {
        // Fix data lama di database
        DB::table('bookings')
            ->where('admin_status', 'waiting_dp')
            ->update(['admin_status' => 'waiting_payment']);

        DB::table('bookings')
            ->where('phase', 'dp_paid')
            ->update(['phase' => 'paid']);
    }

    public function down(): void {}
};