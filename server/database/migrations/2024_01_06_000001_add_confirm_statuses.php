<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Tambah admin_status baru:
// - dp_confirm_pending : customer sudah bayar DP, tunggu konfirmasi admin
// - full_confirm_pending: customer sudah bayar full, tunggu konfirmasi admin
return new class extends Migration
{
    public function up(): void
    {
        // Tidak perlu alter ENUM karena admin_status adalah varchar(50)
        // Hanya perlu update data yang ada
        DB::statement("UPDATE bookings SET admin_status = 'waiting_dp' WHERE admin_status = 'waiting_payment'");
    }
    public function down(): void {}
};