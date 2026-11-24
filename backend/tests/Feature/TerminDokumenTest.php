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
    Carbon::setTestNow('2026-02-14');
    Storage::fake('public');
    $this->proyek = ProyekUji::buat();
    $this->termin = $this->proyek->termin()->where('nomor_termin', 1)->first();
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
});

afterEach(fn () => Carbon::setTestNow());

function unggah($test, string $jenis, ?int $idTermin = null)
{
    return $test->postJson('/api/termin/'.($idTermin ?? $test->termin->id_termin).'/dokumen', [
        'jenis_dokumen' => $jenis,
        'file_dokumen' => UploadedFile::fake()->create("{$jenis}.pdf", 100, 'application/pdf'),
    ]);
}

function verifikasi($test, int $idDokumen, bool $ok = true, ?string $catatan = null)
{
    return $test->patchJson("/api/termin/{$test->termin->id_termin}/dokumen/{$idDokumen}/verifikasi", array_filter([
        'status_verifikasi' => $ok,
        'catatan_revisi' => $catatan,
    ], fn ($v) => $v !== null));
}

function lengkapiChecklist($test): void
{
    $ids = [];
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    foreach (array_keys(config('pantera.dokumen_termin_wajib')) as $jenis) {
        $ids[] = unggah($test, $jenis)->assertStatus(201)->json('data.dokumen.id_dokumen');
    }
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    foreach ($ids as $id) {
        verifikasi($test, $id)->assertStatus(200);
    }
}

test('UC-10: checklist awal berisi 4 dokumen wajib yang belum diunggah', function () {
    $this->getJson("/api/termin/{$this->termin->id_termin}/checklist")
        ->assertStatus(200)
        ->assertJsonCount(4, 'data.dokumen_wajib')
        ->assertJsonPath('data.dokumen_wajib.0.jenis_dokumen', 'laporan_mingguan')
        ->assertJsonPath('data.dokumen_wajib.0.diunggah', false)
        ->assertJsonPath('data.ringkasan.total', 4)
        ->assertJsonPath('data.ringkasan.terverifikasi', 0)
        ->assertJsonPath('data.ringkasan.lengkap', false)
        ->assertJsonPath('data.termin.status_penagihan', 'Belum siap');
});

test('UC-10: unggah dokumen menyimpan file dan belum terverifikasi', function () {
    $response = unggah($this, 'laporan_mingguan');

    $response->assertStatus(201)
        ->assertJsonPath('data.dokumen.jenis_dokumen', 'laporan_mingguan')
        ->assertJsonPath('data.dokumen.status_verifikasi', false)
        ->assertJsonPath('data.checklist.ringkasan.diunggah', 1)
        ->assertJsonPath('data.checklist.ringkasan.terverifikasi', 0);

    Storage::disk('public')->assertExists(DokumenTermin::firstOrFail()->path_file);
});

test('UC-10: status menjadi Siap serah saat 4 dokumen lengkap & terverifikasi Keuangan, kembali Belum siap jika dicabut', function () {
    $jenis = array_keys(config('pantera.dokumen_termin_wajib'));
    $ids = [];
    foreach ($jenis as $j) {
        $ids[$j] = unggah($this, $j)->assertStatus(201)->json('data.dokumen.id_dokumen');
    }

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));

    // 3 dari 4 terverifikasi => belum siap
    foreach (array_slice($ids, 0, 3, true) as $id) {
        verifikasi($this, $id)->assertStatus(200);
    }
    expect($this->termin->refresh()->status_penagihan)->toBe(Termin::STATUS_BELUM_SIAP);

    // dokumen ke-4 => Siap serah
    verifikasi($this, $ids['berita_acara'])->assertStatus(200)
        ->assertJsonPath('data.checklist.ringkasan.persen', 100)
        ->assertJsonPath('data.checklist.ringkasan.lengkap', true)
        ->assertJsonPath('data.checklist.termin.status_penagihan', 'Siap serah')
        ->assertJsonPath('data.checklist.peringatan', null);
    expect($this->termin->refresh()->status_penagihan)->toBe(Termin::STATUS_SIAP_SERAH);

    // cabut verifikasi => kembali Belum siap, catatan revisi wajib
    verifikasi($this, $ids['berita_acara'], false)->assertStatus(422)
        ->assertJsonValidationErrors('catatan_revisi', 'errors');
    verifikasi($this, $ids['berita_acara'], false, 'TTD pengawas belum ada')->assertStatus(200)
        ->assertJsonPath('data.dokumen.catatan_revisi', 'TTD pengawas belum ada')
        ->assertJsonPath('data.checklist.termin.status_penagihan', 'Belum siap');
});

test('UC-10: mengunggah ulang jenis yang sama mengganti file dan mereset verifikasi', function () {
    $id = unggah($this, 'foto_progres')->json('data.dokumen.id_dokumen');
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    verifikasi($this, $id)->assertStatus(200);
    $pathLama = DokumenTermin::findOrFail($id)->path_file;

    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    unggah($this, 'foto_progres')->assertStatus(201)
        ->assertJsonPath('data.dokumen.id_dokumen', $id)
        ->assertJsonPath('data.dokumen.status_verifikasi', false);

    expect(DokumenTermin::count())->toBe(1);
    Storage::disk('public')->assertMissing($pathLama);
    Storage::disk('public')->assertExists(DokumenTermin::findOrFail($id)->path_file);
});

test('UC-10: validasi jenis dokumen, tipe file, dan file wajib', function () {
    $url = "/api/termin/{$this->termin->id_termin}/dokumen";
    $pdf = UploadedFile::fake()->create('a.pdf', 10, 'application/pdf');

    $this->postJson($url, ['jenis_dokumen' => 'kuitansi', 'file_dokumen' => $pdf])
        ->assertStatus(422)->assertJsonValidationErrors('jenis_dokumen', 'errors');
    $this->postJson($url, ['jenis_dokumen' => 'laporan_mingguan'])
        ->assertStatus(422)->assertJsonValidationErrors('file_dokumen', 'errors');
    $this->postJson($url, ['jenis_dokumen' => 'laporan_mingguan', 'file_dokumen' => UploadedFile::fake()->create('a.exe', 10, 'application/x-msdownload')])
        ->assertStatus(422)->assertJsonValidationErrors('file_dokumen', 'errors');
    expect(DokumenTermin::count())->toBe(0);
});

test('UC-10 A1: peringatan kritis muncul menjelang tenggat bila berkas belum lengkap', function () {
    Carbon::setTestNow('2026-03-26');    // 5 hari sebelum tenggat 2026-03-31

    $this->getJson("/api/termin/{$this->termin->id_termin}/checklist")
        ->assertStatus(200)
        ->assertJsonPath('data.peringatan.level', 'Waspada')
        ->assertJsonPath('data.peringatan.hari_ke_tenggat', 5)
        ->assertJsonPath('data.peringatan.kerugian_per_hari', 300000)
        ->assertJsonPath('data.peringatan.pesan', 'Tenggat 5 hari lagi, berkas belum lengkap.');

    // 2 hari lewat tenggat & belum ada progres: butuh ceil(30 / (30/89)) = 89 hari + 2 hari terlewat = 91 hari
    Carbon::setTestNow('2026-04-02');
    $this->getJson("/api/termin/{$this->termin->id_termin}/checklist")
        ->assertJsonPath('data.peringatan.level', 'Kritis')
        ->assertJsonPath('data.peringatan.hari_ke_tenggat', -2)
        ->assertJsonPath('data.peringatan.estimasi_hari_tertunda', 91)
        ->assertJsonPath('data.peringatan.estimasi_kerugian', 27300000);   // 300.000/hari x 91

    Carbon::setTestNow('2026-02-14');    // masih jauh dari tenggat
    $this->getJson("/api/termin/{$this->termin->id_termin}/checklist")
        ->assertJsonPath('data.peringatan', null);
});

test('UC-10: dokumen terkunci setelah termin diajukan ke dinas', function () {
    lengkapiChecklist($this);
    $this->termin->update(['status_penagihan' => Termin::STATUS_DIAJUKAN]);

    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    unggah($this, 'laporan_mingguan')->assertStatus(422)
        ->assertJsonValidationErrors('status_penagihan', 'errors');

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    verifikasi($this, DokumenTermin::first()->id_dokumen, false, 'x')->assertStatus(422);
});

test('UC-10: ringkasan daftar termin proyek memuat checklist tiap termin', function () {
    lengkapiChecklist($this);

    $this->getJson("/api/projects/{$this->proyek->id_proyek}/termin")
        ->assertStatus(200)
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.status_penagihan', 'Siap serah')
        ->assertJsonPath('data.0.checklist.lengkap', true)
        ->assertJsonPath('data.1.status_penagihan', 'Belum siap')
        ->assertJsonPath('data.1.checklist.terverifikasi', 0);
});

test('RBAC & 404: Admin Lapangan unggah dokumen, Keuangan verifikasi dokumen, Direktur baca saja', function () {
    $idDok = unggah($this, 'laporan_mingguan')->json('data.dokumen.id_dokumen');
    $termin2 = $this->proyek->termin()->where('nomor_termin', 2)->first();

    // Admin Lapangan tidak boleh memverifikasi dokumen sendiri
    verifikasi($this, $idDok)->assertStatus(403);
    unggah($this, 'berita_acara', 9999)->assertStatus(404);
    $this->getJson('/api/termin/9999/checklist')->assertStatus(404);

    // Direktur hanya baca checklist (403 untuk upload & verify)
    Sanctum::actingAs(ProyekUji::user('Direktur'));
    unggah($this, 'berita_acara')->assertStatus(403);
    verifikasi($this, $idDok)->assertStatus(403);
    $this->getJson("/api/termin/{$this->termin->id_termin}/checklist")->assertStatus(200);

    // Keuangan memverifikasi dokumen tetapi tidak mengunggah
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    unggah($this, 'berita_acara')->assertStatus(403);
    verifikasi($this, $idDok)->assertStatus(200);
    $this->getJson("/api/termin/{$this->termin->id_termin}/checklist")->assertStatus(200);
    $this->patchJson("/api/termin/{$termin2->id_termin}/dokumen/{$idDok}/verifikasi", ['status_verifikasi' => true])
        ->assertStatus(404)->assertJsonPath('message', 'Dokumen tidak ditemukan pada termin ini.');
});
