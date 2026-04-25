<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration {
    public function up(): void {
        if (!\Schema::hasColumn('bookings', 'hidden_at')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->timestamp('hidden_at')->nullable()->after('rated_at');
            });
        }
    }
    public function down(): void {}
};
