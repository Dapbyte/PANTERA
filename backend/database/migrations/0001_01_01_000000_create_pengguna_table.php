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
        Schema::create('pengguna', function (Blueprint $table) {
            $table->bigIncrements('id_pengguna');
            $table->string('nama');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->enum('peran', ['AdminLapangan', 'SekretarisKeuangan', 'Direktur']);
            $table->boolean('status_aktif')->default(true);

            // Kolom spesifik peran (Single Table Inheritance)
            $table->string('lokasi_tugas')->nullable();
            $table->string('nomor_kontak')->nullable();
            $table->string('divisi')->nullable();
            $table->decimal('batas_verifikasi_kas', 18, 2)->nullable();
            $table->decimal('batas_approval_nominal', 18, 2)->nullable();

            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('pengguna');
    }
};
