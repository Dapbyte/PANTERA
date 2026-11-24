<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progres_fisik', function (Blueprint $table) {
            $table->json('foto_paths')->nullable()->after('path_foto');
        });

        Schema::table('kendala_lapangan', function (Blueprint $table) {
            $table->json('foto_paths')->nullable()->after('path_foto');
        });
    }

    public function down(): void
    {
        Schema::table('progres_fisik', function (Blueprint $table) {
            $table->dropColumn('foto_paths');
        });

        Schema::table('kendala_lapangan', function (Blueprint $table) {
            $table->dropColumn('foto_paths');
        });
    }
};
