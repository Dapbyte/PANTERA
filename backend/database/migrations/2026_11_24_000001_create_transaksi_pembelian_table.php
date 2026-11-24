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
        Schema::create('transaksi_pembelian', function (Blueprint $table) {
            $table->bigIncrements('id_transaksi');
            $table->string('no_po')->unique();
            $table->unsignedBigInteger('id_request')->unique();
            $table->unsignedBigInteger('id_proyek');
            $table->unsignedBigInteger('id_direktur');
            $table->unsignedBigInteger('id_arsip_ref')->nullable();
            $table->date('tanggal_po');
            $table->decimal('total_nominal', 18, 2);
            $table->enum('status_po', ['Diterbitkan', 'Diproses', 'Selesai'])->default('Diterbitkan');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('id_request')
                ->references('id_request')
                ->on('request_material')
                ->cascadeOnDelete();

            $table->foreign('id_proyek')
                ->references('id_proyek')
                ->on('proyek')
                ->cascadeOnDelete();

            $table->foreign('id_direktur')
                ->references('id_pengguna')
                ->on('pengguna')
                ->onDelete('restrict');

            $table->foreign('id_arsip_ref')
                ->references('id_arsip')
                ->on('arsip_dokumen')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi_pembelian');
    }
};
