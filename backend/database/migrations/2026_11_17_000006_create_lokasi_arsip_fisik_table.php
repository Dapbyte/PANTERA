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
        Schema::create('lokasi_arsip_fisik', function (Blueprint $table) {
            $table->bigIncrements('id_lokasi');
            $table->unsignedBigInteger('id_arsip')->unique();
            $table->string('nomor_binder');
            $table->string('nomor_rak');
            $table->string('ruang_simpan');
            $table->string('keterangan_posisi')->nullable();
            $table->timestamps();

            $table->foreign('id_arsip')
                ->references('id_arsip')
                ->on('arsip_dokumen')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lokasi_arsip_fisik');
    }
};
