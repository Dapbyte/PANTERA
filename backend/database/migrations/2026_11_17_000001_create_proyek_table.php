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
        Schema::create('proyek', function (Blueprint $table) {
            $table->bigIncrements('id_proyek');
            $table->unsignedBigInteger('id_pembuat');
            $table->string('kode_proyek')->unique();
            $table->string('nama_proyek');
            $table->string('dinas_pemberi_kerja');
            $table->decimal('nilai_kontrak', 18, 2);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->string('status_proyek')->default('Aktif');
            $table->timestamps();

            $table->foreign('id_pembuat')
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
        Schema::dropIfExists('proyek');
    }
};
