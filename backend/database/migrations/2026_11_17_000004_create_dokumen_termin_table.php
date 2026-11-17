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
        Schema::create('dokumen_termin', function (Blueprint $table) {
            $table->bigIncrements('id_dokumen');
            $table->unsignedBigInteger('id_termin');
            $table->string('jenis_dokumen');
            $table->string('path_file');
            $table->boolean('status_verifikasi')->default(false);
            $table->text('catatan_revisi')->nullable();
            $table->timestamps();

            $table->foreign('id_termin')
                ->references('id_termin')
                ->on('termin')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokumen_termin');
    }
};
