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
        Schema::create('progres_fisik', function (Blueprint $table) {
            $table->bigIncrements('id_progres');
            $table->unsignedBigInteger('id_proyek');
            $table->unsignedBigInteger('id_pelapor');
            $table->date('tanggal_lapor');
            $table->double('persentase_realisasi');
            $table->text('deskripsi_pekerjaan');
            $table->string('path_foto')->nullable();
            $table->boolean('verifikasi_pengawas')->default(false);
            $table->timestamps();

            $table->foreign('id_proyek')
                ->references('id_proyek')
                ->on('proyek');

            $table->foreign('id_pelapor')
                ->references('id_pengguna')
                ->on('pengguna');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progres_fisik');
    }
};
