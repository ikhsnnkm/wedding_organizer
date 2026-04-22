<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Migration Pilihan B: hapus konsep DP, full payment saja
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Hapus kolom DP
            $table->dropColumn(['dp_amount', 'dp_paid_at']);

            // Rename full_paid_at → paid_at
            $table->renameColumn('full_paid_at', 'paid_at');
        });

        // Update phase dp_paid → paid di semua baris yang ada
        DB::table('bookings')->where('phase', 'dp_paid')->update(['phase' => 'paid']);

        // Update admin_status waiting_dp → waiting_payment
        DB::table('bookings')->where('admin_status', 'waiting_dp')->update(['admin_status' => 'waiting_payment']);
        DB::table('bookings')->where('admin_status', 'dp_failed')->update(['admin_status' => 'payment_failed']);

        // Update enum phase di tabel — hapus dp_paid, tambah paid
        // (MySQL tidak bisa alter enum langsung, pakai workaround)
        DB::statement("ALTER TABLE bookings MODIFY COLUMN phase ENUM('pending','paid','in_event','rated') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('dp_amount')->default(0)->after('total_price');
            $table->timestamp('dp_paid_at')->nullable()->after('dp_amount');
            $table->renameColumn('paid_at', 'full_paid_at');
        });
        DB::table('bookings')->where('phase', 'paid')->update(['phase' => 'dp_paid']);
    }
};