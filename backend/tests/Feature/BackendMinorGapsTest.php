<?php

use App\Models\ArsipDokumen;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Support\ProyekUji;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    Carbon::setTestNow('2026-03-20');
    $this->proyek = ProyekUji::buat();
});

afterEach(fn () => Carbon::setTestNow());

test('G3: lokasi arsip fisik dan metadata arsip dapat diperbarui melalui PATCH /archive/{id}', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $arsip = ArsipDokumen::create([
        'id_proyek' => $this->proyek->id_proyek,
        'id_pencatat' => ProyekUji::user('AdminLapangan')->id_pengguna,
        'nomor_surat' => 'BA-01',
        'jenis_transaksi' => 'Berita Acara',
        'pihak_penyedia' => 'CV Karya',
        'kode_arsip' => 'ARS-FSK-20260320-010',
        'judul_dokumen' => 'Berita Acara Lama',
        'jenis_arsip' => 'Berita Acara',
        'tanggal_arsip' => '2026-03-20',
        'tipe_penyimpanan' => 'Fisik',
    ]);
    $arsip->lokasiArsipFisik()->create([
        'nomor_binder' => 'B-01',
        'nomor_rak' => 'R-01',
        'ruang_simpan' => 'Gudang Lama',
    ]);

    $this->patchJson("/api/archive/{$arsip->id_arsip}", [
        'judul_dokumen' => 'Berita Acara Mutu Beton',
        'nomor_binder' => 'B-09',
        'nomor_rak' => 'R-04',
        'ruang_simpan' => 'Ruang Arsip Pusat',
        'keterangan_posisi' => 'Laci paling atas',
    ])->assertStatus(200)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.arsip.judul_dokumen', 'Berita Acara Mutu Beton')
        ->assertJsonPath('data.koordinat_label', 'Ruang Arsip Pusat/R-04/B-09');

    $this->patchJson('/api/archive/99999', ['judul_dokumen' => 'Tidak Ada'])->assertStatus(404);
});

test('G3: verifikasi pengawas progres fisik dapat diubah melalui PATCH /progress/{id}/verifikasi', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $idProgres = $this->postJson("/api/projects/{$this->proyek->id_proyek}/progress", [
        'persentase_realisasi' => 30,
        'deskripsi_pekerjaan' => 'Pemasangan bekisting selesai',
        'tanggal_lapor' => '2026-03-20',
    ])->assertStatus(201)->json('data.progres.id_progres');

    $this->patchJson("/api/progress/{$idProgres}/verifikasi", [
        'verifikasi_pengawas' => true,
    ])->assertStatus(200)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.verifikasi_pengawas', true);

    $this->patchJson('/api/progress/99999/verifikasi', [
        'verifikasi_pengawas' => true,
    ])->assertStatus(404);
});

test('G3: Direktur dapat memperbarui data/status pengguna melalui PATCH /users/{id}', function () {
    $direktur = ProyekUji::user('Direktur');
    $admin = ProyekUji::user('AdminLapangan');

    Sanctum::actingAs($admin);
    $this->patchJson("/api/users/{$admin->id_pengguna}", ['nama' => 'Bypass'])->assertStatus(403);

    Sanctum::actingAs($direktur);

    // Tidak boleh menonaktifkan akun sendiri
    $this->patchJson("/api/users/{$direktur->id_pengguna}", [
        'status_aktif' => false,
    ])->assertStatus(422);

    $this->patchJson("/api/users/{$admin->id_pengguna}", [
        'nama' => 'Odd Dellarobia Updated',
        'lokasi_tugas' => 'Proyek Jembatan Timur',
        'status_aktif' => false,
    ])->assertStatus(200)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.nama', 'Odd Dellarobia Updated')
        ->assertJsonPath('data.status_aktif', false);

    $this->patchJson('/api/users/99999', ['nama' => 'Missing'])->assertStatus(404);
});
