<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Kembalikan kolom DP
            $table->unsignedBigInteger('dp_amount')->nullable()->after('total_price');
            $table->timestamp('dp_paid_at')->nullable()->after('dp_amount');
            $table->timestamp('full_paid_at')->nullable()->after('dp_paid_at');
        });

        // Rename paid_at → dipakai sebagai alias, tapi kita tetap punya paid_at untuk backward compat
        // Update enum phase: tambah dp_paid
        DB::statement("ALTER TABLE bookings MODIFY COLUMN phase ENUM('pending','dp_paid','paid','in_event','rated') NOT NULL DEFAULT 'pending'");

        // Update admin_status enum: tambah waiting_dp
        // waiting_payment → waiting_dp untuk yang belum bayar DP
        DB::table('bookings')
            ->where('admin_status', 'waiting_payment')
            ->update(['admin_status' => 'waiting_dp']);

        // yang sudah paid → dp_paid
        DB::table('bookings')
            ->whereNotNull('paid_at')
            ->where('phase', 'paid')
            ->update([
                'phase'       => 'dp_paid',
                'dp_paid_at'  => DB::raw('paid_at'),
            ]);
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['dp_amount', 'dp_paid_at', 'full_paid_at']);
        });
    }
};