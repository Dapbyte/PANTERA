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
        Schema::create('arsip_dokumen', function (Blueprint $table) {
            $table->bigIncrements('id_arsip');
            $table->unsignedBigInteger('id_proyek');
            $table->unsignedBigInteger('id_pencatat');
            $table->string('nomor_surat');
            $table->string('jenis_transaksi');
            $table->string('pihak_penyedia');
            $table->string('kode_arsip')->unique();
            $table->string('judul_dokumen');
            $table->string('jenis_arsip');
            $table->date('tanggal_arsip');
            $table->enum('tipe_penyimpanan', ['Fisik', 'Digital', 'Hibrida']);
            $table->string('path_digital')->nullable();
            $table->timestamps();

            $table->foreign('id_proyek')
                ->references('id_proyek')
                ->on('proyek')
                ->cascadeOnDelete();

            $table->foreign('id_pencatat')
                ->references('id_pengguna')
                ->on('pengguna')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arsip_dokumen');
    }
};
