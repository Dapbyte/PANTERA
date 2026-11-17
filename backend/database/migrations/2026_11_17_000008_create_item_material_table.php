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
        Schema::create('item_material', function (Blueprint $table) {
            $table->bigIncrements('id_item');
            $table->unsignedBigInteger('id_request');
            $table->string('nama_material');
            $table->double('volume');
            $table->string('satuan');
            $table->decimal('estimasi_harga', 18, 2);
            $table->boolean('ketersediaan_vendor')->default(false);
            $table->timestamps();

            $table->foreign('id_request')
                ->references('id_request')
                ->on('request_material')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_material');
    }
};
