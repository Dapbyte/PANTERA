<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('termin', function (Blueprint $table){
            $table->text('catatan_koreksi_dinas')->nullable()->after('tanggal_cair');
        });
    }
    public function down(): void
    {
        Schema::table('termin', function (Blueprint $table){
            $table->dropColumn(['catatan_koreksi_dinas']);
        });
    }
};