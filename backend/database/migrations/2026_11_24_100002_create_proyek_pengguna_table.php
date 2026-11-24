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
        Schema::create('proyek_pengguna', function (Blueprint $table) {
            $table->unsignedBigInteger('id_proyek');
            $table->unsignedBigInteger('id_pengguna');
            $table->timestamps();

            $table->primary(['id_proyek', 'id_pengguna']);

            $table->foreign('id_proyek')
                ->references('id_proyek')
                ->on('proyek')
                ->cascadeOnDelete();

            $table->foreign('id_pengguna')
                ->references('id_pengguna')
                ->on('pengguna')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyek_pengguna');
    }
};
