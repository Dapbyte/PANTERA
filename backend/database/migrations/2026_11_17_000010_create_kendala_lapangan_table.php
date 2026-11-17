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
        Schema::create('kendala_lapangan', function (Blueprint $table) {
            $table->bigIncrements('id_kendala');
            $table->unsignedBigInteger('id_progres');
            $table->date('tanggal_kejadian');
            $table->string('kategori_kendala');
            $table->string('tingkat_keparahan');
            $table->text('deskripsi_kendala');
            $table->integer('estimasi_hari_tertunda');
            $table->string('status_penanganan');
            $table->date('tanggal_resolved')->nullable();
            $table->text('catatan_penyelesaian')->nullable();
            $table->timestamps();

            $table->foreign('id_progres')
                ->references('id_progres')
                ->on('progres_fisik')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kendala_lapangan');
    }
};
