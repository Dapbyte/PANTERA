<?php

use App\Models\DokumenTermin;
use App\Models\Termin;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\ProyekUji;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    Carbon::setTestNow('2026-03-20');
    Storage::fake('public');
    $this->proyek = ProyekUji::buat();
    $this->termin = $this->proyek->termin()->where('nomor_termin', 1)->first();
    $this->idTermin = $this->termin->id_termin;
});

afterEach(fn () => Carbon::setTestNow());

/** Admin lapangan mengunggah 4 dokumen, lalu Keuangan memverifikasi => termin 'Siap serah'. */
function siapkanTerminSiapSerah($test): void
{
    $ids = [];
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    foreach (array_keys(config('pantera.dokumen_termin_wajib')) as $jenis) {
        $ids[] = $test->postJson("/api/termin/{$test->idTermin}/dokumen", [
            'jenis_dokumen' => $jenis,
            'file_dokumen' => UploadedFile::fake()->create("{$jenis}.pdf", 50, 'application/pdf'),
        ])->assertStatus(201)->json('data.dokumen.id_dokumen');
    }
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    foreach ($ids as $id) {
        $test->patchJson("/api/termin/{$test->idTermin}/dokumen/{$id}/verifikasi", ['status_verifikasi' => true])->assertStatus(200);
    }
}

test('UC-06: alur lengkap Siap serah -> Diajukan ke Dinas -> SP2D cair', function () {
    siapkanTerminSiapSerah($this);

    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => '027/DMP/III/2026'])
        ->assertStatus(200)
        ->assertJsonPath('data.status_penagihan', 'Diajukan ke Dinas')
        ->assertJsonPath('data.nomor_surat_serah', '027/DMP/III/2026')
        ->assertJsonPath('data.tanggal_pengajuan', '2026-03-20');

    Carbon::setTestNow('2026-04-15');
    $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['nomor_sp2d' => 'SP2D-0001/2026', 'tanggal_cair' => '2026-04-15'])
        ->assertStatus(200)
        ->assertJsonPath('data.status_penagihan', 'SP2D cair')
        ->assertJsonPath('data.nomor_sp2d', 'SP2D-0001/2026')
        ->assertJsonPath('data.tanggal_cair', '2026-04-15');

    // Katalog proyek (fitur teman) kini menunjuk termin berikutnya sebagai posisi berjalan
    $this->getJson('/api/projects')->assertStatus(200)
        ->assertJsonPath('data.0.posisi_termin_berjalan.nomor_termin', 2);
});

test('UC-06: pengajuan ditolak 422 jika termin belum Siap serah', function () {
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));

    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => '027/DMP/III/2026'])
        ->assertStatus(422)->assertJsonValidationErrors('status_penagihan', 'errors');
    $this->postJson("/api/termin/{$this->idTermin}/ajukan", [])
        ->assertStatus(422)->assertJsonValidationErrors('nomor_surat_serah', 'errors');
    expect($this->termin->refresh()->status_penagihan)->toBe(Termin::STATUS_BELUM_SIAP);
});

test('UC-06 A1: dinas mengembalikan berkas, dokumen ditandai revisi, lalu diajukan ulang', function () {
    siapkanTerminSiapSerah($this);
    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A-1'])->assertStatus(200);
    $idDokumen = DokumenTermin::where('jenis_dokumen', 'berita_acara')->value('id_dokumen');

    $this->postJson("/api/termin/{$this->idTermin}/koreksi", [
        'catatan_koreksi_dinas' => 'Format lampiran berita acara tidak sesuai.',
        'dokumen' => [['id_dokumen' => $idDokumen, 'catatan_revisi' => 'Gunakan format BA terbaru']],
    ])->assertStatus(200)
        ->assertJsonPath('data.status_penagihan', 'Belum siap')
        ->assertJsonPath('data.catatan_koreksi_dinas', 'Format lampiran berita acara tidak sesuai.')
        ->assertJsonPath('data.nomor_surat_serah', null)
        ->assertJsonPath('data.tanggal_pengajuan', null);

    $dok = DokumenTermin::findOrFail($idDokumen);
    expect($dok->status_verifikasi)->toBeFalse()->and($dok->catatan_revisi)->toBe('Gunakan format BA terbaru');

    // Admin mengunggah ulang; Keuangan memverifikasi => Siap serah lagi
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $this->postJson("/api/termin/{$this->idTermin}/dokumen", [
        'jenis_dokumen' => 'berita_acara',
        'file_dokumen' => UploadedFile::fake()->create('ba-baru.pdf', 50, 'application/pdf'),
    ])->assertStatus(201);
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->patchJson("/api/termin/{$this->idTermin}/dokumen/{$idDokumen}/verifikasi", ['status_verifikasi' => true])->assertStatus(200);
    expect($this->termin->refresh()->status_penagihan)->toBe(Termin::STATUS_SIAP_SERAH);

    // Diajukan ulang dengan surat baru; catatan koreksi dibersihkan
    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A-2'])
        ->assertStatus(200)
        ->assertJsonPath('data.status_penagihan', 'Diajukan ke Dinas')
        ->assertJsonPath('data.catatan_koreksi_dinas', null);
});

test('UC-06 A1: koreksi tanpa menandai dokumen mengembalikan status ke Siap serah (koreksi administratif)', function () {
    siapkanTerminSiapSerah($this);
    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A-1'])->assertStatus(200);

    $this->postJson("/api/termin/{$this->idTermin}/koreksi", ['catatan_koreksi_dinas' => 'Nomor surat salah ketik.'])
        ->assertStatus(200)
        ->assertJsonPath('data.status_penagihan', 'Siap serah')
        ->assertJsonPath('data.catatan_koreksi_dinas', 'Nomor surat salah ketik.');
});

test('UC-06 A1: koreksi ditolak jika dokumen bukan milik termin atau termin belum diajukan', function () {
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->postJson("/api/termin/{$this->idTermin}/koreksi", ['catatan_koreksi_dinas' => 'x'])
        ->assertStatus(422)->assertJsonValidationErrors('status_penagihan', 'errors');

    siapkanTerminSiapSerah($this);
    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A-1'])->assertStatus(200);

    $this->postJson("/api/termin/{$this->idTermin}/koreksi", [
        'catatan_koreksi_dinas' => 'x',
        'dokumen' => [['id_dokumen' => 9999, 'catatan_revisi' => 'y']],
    ])->assertStatus(422)->assertJsonValidationErrors('dokumen', 'errors');
    expect($this->termin->refresh()->status_penagihan)->toBe(Termin::STATUS_DIAJUKAN);   // transaksi dibatalkan
});

test('UC-06: SP2D hanya untuk termin Diajukan, nomor unik, dan tanggal tidak sebelum pengajuan', function () {
    siapkanTerminSiapSerah($this);

    $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['nomor_sp2d' => 'SP2D-1', 'tanggal_cair' => '2026-03-20'])
        ->assertStatus(422)->assertJsonValidationErrors('status_penagihan', 'errors');

    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A-1', 'tanggal_pengajuan' => '2026-03-18'])->assertStatus(200);

    $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['nomor_sp2d' => 'SP2D-1', 'tanggal_cair' => '2026-03-17'])
        ->assertStatus(422)->assertJsonValidationErrors('tanggal_cair', 'errors');
    $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['nomor_sp2d' => 'SP2D-1', 'tanggal_cair' => '2026-04-01'])
        ->assertStatus(422)->assertJsonValidationErrors('tanggal_cair', 'errors');   // masa depan
    $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['tanggal_cair' => '2026-03-20'])
        ->assertStatus(422)->assertJsonValidationErrors('nomor_sp2d', 'errors');

    $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['nomor_sp2d' => 'SP2D-1', 'tanggal_cair' => '2026-03-20'])->assertStatus(200);

    // nomor SP2D yang sama tidak boleh dipakai termin lain
    $termin2 = $this->proyek->termin()->where('nomor_termin', 2)->first();
    $termin2->update(['status_penagihan' => Termin::STATUS_DIAJUKAN, 'tanggal_pengajuan' => '2026-03-19']);
    $this->postJson("/api/termin/{$termin2->id_termin}/sp2d", ['nomor_sp2d' => 'SP2D-1', 'tanggal_cair' => '2026-03-20'])
        ->assertStatus(422)->assertJsonValidationErrors('nomor_sp2d', 'errors');
});

test('pengajuan ke dinas mengosongkan estimasi_kerugian termin tersebut', function () {
    $this->termin->update(['estimasi_kerugian' => 5000000]);
    siapkanTerminSiapSerah($this);

    $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A-1'])->assertStatus(200);

    expect((float) $this->termin->refresh()->estimasi_kerugian)->toBe(0.0);
});

test('RBAC: billing hanya untuk Sekretaris/Keuangan, 404 untuk termin tak dikenal', function () {
    foreach (['AdminLapangan', 'Direktur'] as $peran) {
        Sanctum::actingAs(ProyekUji::user($peran));
        $this->postJson("/api/termin/{$this->idTermin}/ajukan", ['nomor_surat_serah' => 'A'])->assertStatus(403);
        $this->postJson("/api/termin/{$this->idTermin}/koreksi", ['catatan_koreksi_dinas' => 'x'])->assertStatus(403);
        $this->postJson("/api/termin/{$this->idTermin}/sp2d", ['nomor_sp2d' => 'S', 'tanggal_cair' => '2026-03-20'])->assertStatus(403);
    }

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->postJson('/api/termin/9999/ajukan', ['nomor_surat_serah' => 'A'])->assertStatus(404);
    $this->postJson('/api/termin/9999/koreksi', ['catatan_koreksi_dinas' => 'x'])->assertStatus(404);
    $this->postJson('/api/termin/9999/sp2d', ['nomor_sp2d' => 'S', 'tanggal_cair' => '2026-03-20'])->assertStatus(404);
});
