<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('request_material', function (Blueprint $table) {
            $table->text('catatan_keuangan')->nullable()->after('catatan_direktur');
            $table->enum('skema_pembayaran', ['Kas', 'Kredit'])->nullable()->after('catatan_keuangan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_material', function (Blueprint $table) {
            $table->dropColumn(['skema_pembayaran', 'catatan_keuangan']);
        });
    }
};
