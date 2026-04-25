<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration {
    public function up(): void {
        // Fix dp_amount: set nullable agar tidak error saat insert tanpa dp_amount
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('dp_amount')->nullable()->change();
        });
        
        // Update dp_amount untuk booking yang sudah ada (30% dari total_price)
        DB::statement('UPDATE bookings SET dp_amount = ROUND(total_price * 0.3) WHERE dp_amount IS NULL OR dp_amount = 0');
    }
    public function down(): void {}
};