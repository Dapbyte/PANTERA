<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kendala_lapangan', function (Blueprint $table) {
            $table->string('path_foto')->nullable()->after('catatan_penyelesaian');
        });
    }

    public function down(): void
    {
        Schema::table('kendala_lapangan', function (Blueprint $table) {
            $table->dropColumn('path_foto');
        });
    }
};
