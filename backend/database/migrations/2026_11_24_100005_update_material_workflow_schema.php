<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('request_material', function (Blueprint $table) {
            $table->string('status_approval', 50)->default('Diajukan')->change();
            $table->decimal('total_estimasi', 18, 2)->nullable()->default(null)->change();
            $table->date('tanggal_butuh')->nullable()->after('tanggal_pengajuan');
            $table->text('catatan_lapangan')->nullable()->after('catatan_keuangan');
            $table->text('alasan_penolakan')->nullable()->after('catatan_lapangan');
            $table->boolean('melebihi_rab')->default(false)->after('alasan_penolakan');
        });

        // Map legacy statuses to the new workflow statuses if existing records exist
        DB::table('request_material')->where('status_approval', 'Pending')->update(['status_approval' => 'Diajukan']);
        DB::table('request_material')->where('status_approval', 'TervalidasiKeuangan')->update(['status_approval' => 'Menunggu Direktur']);
        DB::table('request_material')->where('status_approval', 'Disetujui')->update(['status_approval' => 'Selesai']);
        DB::table('request_material')->where('status_approval', 'Revisi')->update(['status_approval' => 'Perlu Revisi']);

        Schema::table('item_material', function (Blueprint $table) {
            $table->decimal('estimasi_harga', 18, 2)->nullable()->default(null)->change();
            $table->string('vendor_nama')->nullable()->after('ketersediaan_vendor');
            $table->string('vendor_pengganti')->nullable()->after('vendor_nama');
        });

        Schema::create('riwayat_revisi_material', function (Blueprint $table) {
            $table->bigIncrements('id_revisi');
            $table->unsignedBigInteger('id_request');
            $table->unsignedBigInteger('id_pengguna')->nullable();
            $table->string('peran', 40);
            $table->string('aksi', 50);
            $table->text('alasan')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('id_request')
                ->references('id_request')
                ->on('request_material')
                ->cascadeOnDelete();

            $table->foreign('id_pengguna')
                ->references('id_pengguna')
                ->on('pengguna')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_revisi_material');

        Schema::table('item_material', function (Blueprint $table) {
            $table->dropColumn(['vendor_pengganti', 'vendor_nama']);
        });

        Schema::table('request_material', function (Blueprint $table) {
            $table->dropColumn(['melebihi_rab', 'alasan_penolakan', 'catatan_lapangan', 'tanggal_butuh']);
        });
    }
};
