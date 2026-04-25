<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah guest_count ke bookings
        if (!\Schema::hasColumn('bookings', 'guest_count')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->unsignedInteger('guest_count')->nullable()->after('konsep');
            });
        }

        // Tambah max_guests ke packages
        if (!\Schema::hasColumn('packages', 'max_guests')) {
            Schema::table('packages', function (Blueprint $table) {
                $table->unsignedInteger('max_guests')->nullable()->after('price');
            });
        }

        // Update max_guests sesuai tier
        DB::table('packages')->where('tier_id', 'silver')->update(['max_guests' => 100]);
        DB::table('packages')->where('tier_id', 'gold')->update(['max_guests' => 300]);
        DB::table('packages')->where('tier_id', 'platinum')->update(['max_guests' => 600]);
    }

    public function down(): void
    {
        Schema::table('bookings', fn($t) => $t->dropColumn('guest_count'));
        Schema::table('packages', fn($t) => $t->dropColumn('max_guests'));
    }
};