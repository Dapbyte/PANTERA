<?php

use App\Models\KendalaLapangan;
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
    $this->urlKendala = "/api/projects/{$this->proyek->id_proyek}/kendala";
    $this->payload = [
        'kategori_kendala' => 'Cuaca',
        'tingkat_keparahan' => 'Berat',
        'deskripsi_kendala' => 'Hujan lebat, sungai meluap di area Pilar P6.',
        'estimasi_hari_tertunda' => 3,
    ];
});

afterEach(fn () => Carbon::setTestNow());

function laporProgres($test, int $persen = 10): int
{
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    return $test->postJson("/api/projects/{$test->proyek->id_proyek}/progress", [
        'persentase_realisasi' => $persen,
        'deskripsi_pekerjaan' => 'Pekerjaan harian',
    ])->assertStatus(201)->json('data.progres.id_progres');
}

test('UC-09: kendala menempel pada progres terbaru, status Aktif, dan memicu early warning', function () {
    $idProgres = laporProgres($this, 15);

    $response = $this->postJson($this->urlKendala, $this->payload + [
        'foto' => UploadedFile::fake()->create('banjir.jpg', 100, 'image/jpeg'),
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.kendala.id_progres', $idProgres)
        ->assertJsonPath('data.kendala.status_penanganan', 'Aktif')
        ->assertJsonPath('data.kendala.estimasi_hari_tertunda', 3)
        ->assertJsonPath('data.early_warning.skor_kendala', 3)
        ->assertJsonPath('data.early_warning.status', 'Waspada')
        ->assertJsonCount(1, 'data.early_warning.kendala_aktif');

    $kendala = KendalaLapangan::firstOrFail();
    expect($kendala->path_foto)->toStartWith('kendala/');
    Storage::disk('public')->assertExists($kendala->path_foto);
});

test('UC-09: dapat menempelkan kendala ke id_progres tertentu milik proyek', function () {
    $pertama = laporProgres($this, 5);
    laporProgres($this, 10);

    $this->postJson($this->urlKendala, $this->payload + ['id_progres' => $pertama])
        ->assertStatus(201)
        ->assertJsonPath('data.kendala.id_progres', $pertama);
});

test('UC-09: kendala ditolak 422 jika proyek belum punya laporan progres', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $this->postJson($this->urlKendala, $this->payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_progres', 'errors');
    expect(KendalaLapangan::count())->toBe(0);
});

test('UC-09: id_progres milik proyek lain ditolak 422', function () {
    laporProgres($this, 5);
    $lain = ProyekUji::buat();
    $lain->progresFisik()->create([
        'id_pelapor' => ProyekUji::user('AdminLapangan')->id_pengguna,
        'tanggal_lapor' => '2026-02-01',
        'persentase_realisasi' => 3,
        'deskripsi_pekerjaan' => 'Proyek lain',
    ]);
    $idProgresLain = $lain->progresFisik()->value('id_progres');

    $this->postJson($this->urlKendala, $this->payload + ['id_progres' => $idProgresLain])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_progres', 'errors');
});

test('UC-09: validasi kategori, keparahan, dan estimasi hari', function () {
    laporProgres($this);

    $this->postJson($this->urlKendala, array_merge($this->payload, ['kategori_kendala' => 'Politik']))
        ->assertStatus(422)->assertJsonValidationErrors('kategori_kendala', 'errors');
    $this->postJson($this->urlKendala, array_merge($this->payload, ['tingkat_keparahan' => 'Parah']))
        ->assertStatus(422)->assertJsonValidationErrors('tingkat_keparahan', 'errors');
    $this->postJson($this->urlKendala, array_merge($this->payload, ['estimasi_hari_tertunda' => -1]))
        ->assertStatus(422)->assertJsonValidationErrors('estimasi_hari_tertunda', 'errors');
    $this->postJson($this->urlKendala, array_merge($this->payload, ['deskripsi_kendala' => '']))
        ->assertStatus(422)->assertJsonValidationErrors('deskripsi_kendala', 'errors');
});

test('UC-09 A1: kendala dapat di-resolve dan early warning disegarkan', function () {
    laporProgres($this, 15);
    $id = $this->postJson($this->urlKendala, $this->payload)->assertStatus(201)->json('data.kendala.id_kendala');

    $this->patchJson("/api/kendala/{$id}/resolve", [
        'tanggal_resolved' => '2026-02-14',
        'catatan_penyelesaian' => 'Air surut, pekerjaan dilanjutkan.',
    ])->assertStatus(200)
        ->assertJsonPath('data.kendala.status_penanganan', 'Resolved')
        ->assertJsonPath('data.kendala.tanggal_resolved', '2026-02-14')
        ->assertJsonPath('data.early_warning.skor_kendala', 0)
        ->assertJsonCount(0, 'data.early_warning.kendala_aktif');

    // Resolve ulang ditolak
    $this->patchJson("/api/kendala/{$id}/resolve", ['catatan_penyelesaian' => 'Lagi'])
        ->assertStatus(422)->assertJsonValidationErrors('status_penanganan', 'errors');
});

test('UC-09 A1: tanggal resolve sebelum tanggal kejadian ditolak', function () {
    laporProgres($this, 15);
    $id = $this->postJson($this->urlKendala, $this->payload + ['tanggal_kejadian' => '2026-02-10'])
        ->assertStatus(201)->json('data.kendala.id_kendala');

    $this->patchJson("/api/kendala/{$id}/resolve", [
        'tanggal_resolved' => '2026-02-09',
        'catatan_penyelesaian' => 'x',
    ])->assertStatus(422)->assertJsonValidationErrors('tanggal_resolved', 'errors');
});

test('daftar kendala dapat difilter status dan dibaca semua peran', function () {
    laporProgres($this, 15);
    $a = $this->postJson($this->urlKendala, $this->payload)->json('data.kendala.id_kendala');
    $this->postJson($this->urlKendala, array_merge($this->payload, ['kategori_kendala' => 'Material', 'tingkat_keparahan' => 'Ringan']))->assertStatus(201);
    $this->patchJson("/api/kendala/{$a}/resolve", ['catatan_penyelesaian' => 'Selesai'])->assertStatus(200);

    foreach (['Direktur', 'SekretarisKeuangan', 'AdminLapangan'] as $peran) {
        Sanctum::actingAs(ProyekUji::user($peran));
        $this->getJson($this->urlKendala)->assertStatus(200)->assertJsonCount(2, 'data');
        $this->getJson($this->urlKendala.'?status=Aktif')->assertStatus(200)
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.kategori_kendala', 'Material');
        $this->getJson($this->urlKendala.'?status=Resolved')->assertStatus(200)
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.kategori_kendala', 'Cuaca');
    }
});

test('RBAC: hanya admin lapangan yang boleh melapor dan me-resolve kendala', function () {
    laporProgres($this, 15);
    $id = $this->postJson($this->urlKendala, $this->payload)->json('data.kendala.id_kendala');

    foreach (['Direktur', 'SekretarisKeuangan'] as $peran) {
        Sanctum::actingAs(ProyekUji::user($peran));
        $this->postJson($this->urlKendala, $this->payload)->assertStatus(403);
        $this->patchJson("/api/kendala/{$id}/resolve", ['catatan_penyelesaian' => 'x'])->assertStatus(403);
    }
    expect(KendalaLapangan::count())->toBe(1);
});

test('kendala atau proyek tidak ditemukan mengembalikan 404', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $this->patchJson('/api/kendala/9999/resolve', ['catatan_penyelesaian' => 'x'])
        ->assertStatus(404)->assertJsonPath('message', 'Kendala tidak ditemukan.');
    $this->postJson('/api/projects/9999/kendala', $this->payload)->assertStatus(404);
    $this->getJson('/api/projects/9999/kendala')->assertStatus(404);
});
