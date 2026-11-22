<?php

use App\Models\ProgresFisik;
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
});

afterEach(fn () => Carbon::setTestNow());

test('UC-08: admin lapangan menyimpan progres beserta foto dan menerima evaluasi', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $response = $this->postJson("/api/projects/{$this->proyek->id_proyek}/progress", [
        'tanggal_lapor' => '2026-02-14',
        'persentase_realisasi' => 15.5,
        'deskripsi_pekerjaan' => 'Pengecoran pier cap P6 selesai.',
        'foto' => UploadedFile::fake()->create('progres.jpg', 100, 'image/jpeg'),
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.progres.persentase_realisasi', 15.5)
        ->assertJsonPath('data.progres.verifikasi_pengawas', false)
        ->assertJsonPath('data.milestone_tercapai', [])
        ->assertJsonPath('data.early_warning.termin_berjalan.nomor_termin', 1);

    $progres = ProgresFisik::firstOrFail();
    expect($progres->id_pelapor)->toBe(ProyekUji::user('AdminLapangan')->id_pengguna)
        ->and($progres->path_foto)->toStartWith('progres/');
    Storage::disk('public')->assertExists($progres->path_foto);
});

test('UC-08: milestone termin tercapai dilaporkan saat target kumulatif terpenuhi', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $this->postJson("/api/projects/{$this->proyek->id_proyek}/progress", [
        'persentase_realisasi' => 31,
        'deskripsi_pekerjaan' => 'Target termin 1 terlewati.',
    ])->assertStatus(201)
        ->assertJsonCount(1, 'data.milestone_tercapai')
        ->assertJsonPath('data.milestone_tercapai.0.nomor_termin', 1);
});

test('UC-08: capaian kumulatif tidak boleh turun dari laporan sebelumnya (422)', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $url = "/api/projects/{$this->proyek->id_proyek}/progress";

    $this->postJson($url, ['persentase_realisasi' => 20, 'deskripsi_pekerjaan' => 'Laporan A'])->assertStatus(201);

    $this->postJson($url, ['persentase_realisasi' => 19, 'deskripsi_pekerjaan' => 'Laporan B'])
        ->assertStatus(422)
        ->assertJsonPath('status', 'error')
        ->assertJsonValidationErrors('persentase_realisasi', 'errors');

    expect(ProgresFisik::count())->toBe(1);
});

test('UC-08: validasi menolak persentase di luar 0-100, deskripsi kosong, dan tanggal masa depan', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $url = "/api/projects/{$this->proyek->id_proyek}/progress";

    $this->postJson($url, ['persentase_realisasi' => 101, 'deskripsi_pekerjaan' => 'x'])
        ->assertStatus(422)->assertJsonValidationErrors('persentase_realisasi', 'errors');

    $this->postJson($url, ['persentase_realisasi' => 10])
        ->assertStatus(422)->assertJsonValidationErrors('deskripsi_pekerjaan', 'errors');

    $this->postJson($url, ['persentase_realisasi' => 10, 'deskripsi_pekerjaan' => 'x', 'tanggal_lapor' => '2026-03-01'])
        ->assertStatus(422)->assertJsonValidationErrors('tanggal_lapor', 'errors');

    $this->postJson($url, ['persentase_realisasi' => 10, 'deskripsi_pekerjaan' => 'x', 'foto' => UploadedFile::fake()->create('a.pdf', 10)])
        ->assertStatus(422)->assertJsonValidationErrors('foto', 'errors');
});

test('RBAC: hanya admin lapangan yang boleh input progres', function () {
    $url = "/api/projects/{$this->proyek->id_proyek}/progress";
    $payload = ['persentase_realisasi' => 10, 'deskripsi_pekerjaan' => 'x'];

    $this->postJson($url, $payload)->assertStatus(401);

    foreach (['Direktur', 'SekretarisKeuangan'] as $peran) {
        Sanctum::actingAs(ProyekUji::user($peran));
        $this->postJson($url, $payload)->assertStatus(403);
    }
    expect(ProgresFisik::count())->toBe(0);
});

test('proyek tidak ditemukan mengembalikan 404 dan id non-numerik tidak match route', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $this->postJson('/api/projects/9999/progress', ['persentase_realisasi' => 10, 'deskripsi_pekerjaan' => 'x'])
        ->assertStatus(404)->assertJsonPath('message', 'Proyek tidak ditemukan.');
    $this->getJson('/api/projects/9999/progress')->assertStatus(404);
    $this->getJson('/api/projects/abc/progress')->assertStatus(404);
});

test('riwayat progres dapat dibaca semua peran, terbaru dulu', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $url = "/api/projects/{$this->proyek->id_proyek}/progress";
    $this->postJson($url, ['tanggal_lapor' => '2026-02-01', 'persentase_realisasi' => 5, 'deskripsi_pekerjaan' => 'Awal'])->assertStatus(201);
    $this->postJson($url, ['tanggal_lapor' => '2026-02-10', 'persentase_realisasi' => 12, 'deskripsi_pekerjaan' => 'Lanjut'])->assertStatus(201);

    foreach (['Direktur', 'SekretarisKeuangan', 'AdminLapangan'] as $peran) {
        Sanctum::actingAs(ProyekUji::user($peran));
        $this->getJson($url)->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.persentase_realisasi', 12)
            ->assertJsonPath('data.1.persentase_realisasi', 5)
            ->assertJsonPath('data.0.pelapor.nama', 'Odd Dellarobia');
    }
});

test('input progres menyimpan estimasi_kerugian ke termin berjalan', function () {
    Carbon::setTestNow('2026-03-01');
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $url = "/api/projects/{$this->proyek->id_proyek}/progress";

    $this->postJson($url, ['tanggal_lapor' => '2026-02-01', 'persentase_realisasi' => 5, 'deskripsi_pekerjaan' => 'A'])->assertStatus(201);
    $this->postJson($url, ['tanggal_lapor' => '2026-03-01', 'persentase_realisasi' => 12, 'deskripsi_pekerjaan' => 'B'])
        ->assertStatus(201)
        ->assertJsonPath('data.early_warning.prediksi.estimasi_hari_terlambat', 42);

    expect((float) $this->proyek->termin()->where('nomor_termin', 1)->value('estimasi_kerugian'))->toBe(12600000.0);
});
