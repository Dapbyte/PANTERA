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
        Schema::create('rab', function (Blueprint $table) {
            $table->bigIncrements('id_rab');
            $table->unsignedBigInteger('id_proyek')->unique();
            $table->decimal('total_pagu', 18, 2);
            $table->decimal('sisa_pagu', 18, 2);
            $table->date('tanggal_ditetapkan');
            $table->string('versi_rab')->default('1');
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
        Schema::dropIfExists('rab');
    }
};
