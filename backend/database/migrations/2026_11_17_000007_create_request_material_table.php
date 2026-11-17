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
        Schema::create('request_material', function (Blueprint $table) {
            $table->bigIncrements('id_request');
            $table->string('no_request')->unique();
            $table->unsignedBigInteger('id_proyek');
            $table->unsignedBigInteger('id_pengaju');
            $table->unsignedBigInteger('id_validator')->nullable();
            $table->unsignedBigInteger('id_direktur')->nullable();
            $table->unsignedBigInteger('id_arsip_ref')->nullable();
            $table->date('tanggal_pengajuan');
            $table->enum('sifat_pengajuan', ['Rutin', 'Darurat']);
            $table->decimal('total_estimasi', 18, 2);
            $table->enum('status_approval', [
                'Pending',
                'TervalidasiKeuangan',
                'Disetujui',
                'Revisi',
            ])->default('Pending');
            $table->text('catatan_direktur')->nullable();
            $table->timestamps();

            $table->foreign('id_proyek')
                ->references('id_proyek')
                ->on('proyek');

            $table->foreign('id_pengaju')
                ->references('id_pengguna')
                ->on('pengguna');

            $table->foreign('id_validator')
                ->references('id_pengguna')
                ->on('pengguna')
                ->nullOnDelete();

            $table->foreign('id_direktur')
                ->references('id_pengguna')
                ->on('pengguna')
                ->nullOnDelete();

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
        Schema::dropIfExists('request_material');
    }
};
