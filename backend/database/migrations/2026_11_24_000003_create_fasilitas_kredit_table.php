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
        Schema::create('fasilitas_kredit', function (Blueprint $table) {
            $table->bigIncrements('id_kredit');
            $table->unsignedBigInteger('id_proyek');
            $table->unsignedBigInteger('id_pencatat');
            $table->string('nama_bank');
            $table->string('nomor_fasilitas')->nullable();
            $table->decimal('plafon_kredit', 18, 2);
            $table->decimal('suku_bunga', 5, 2)->nullable();
            $table->unsignedInteger('tenor_bulan');
            $table->date('tanggal_koordinasi');
            $table->date('tanggal_jatuh_tempo_baru')->nullable();
            $table->enum('status_koordinasi', ['Diajukan', 'Disetujui', 'Ditolak'])->default('Diajukan');
            $table->text('catatan_kesepakatan')->nullable();
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
        Schema::dropIfExists('fasilitas_kredit');
    }
};
