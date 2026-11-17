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
        Schema::create('termin', function (Blueprint $table) {
            $table->bigIncrements('id_termin');
            $table->unsignedBigInteger('id_proyek');
            $table->integer('nomor_termin');
            $table->double('target_persentase');
            $table->decimal('nilai_tagihan', 18, 2);
            $table->date('tenggat_waktu');
            $table->enum('status_penagihan', [
                'Belum siap',
                'Siap serah',
                'Diajukan ke Dinas',
                'SP2D cair',
            ])->default('Belum siap');
            $table->decimal('estimasi_kerugian', 18, 2)->default(0);
            $table->date('tanggal_pengajuan')->nullable();
            $table->string('nomor_surat_serah')->nullable();
            $table->string('nomor_sp2d')->nullable();
            $table->date('tanggal_cair')->nullable();
            $table->timestamps();

            $table->foreign('id_proyek')
                ->references('id_proyek')
                ->on('proyek')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('termin');
    }
};
