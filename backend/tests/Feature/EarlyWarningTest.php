<?php

use App\Models\KendalaLapangan;
use App\Models\Termin;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Support\ProyekUji;

/*
 * Data uji (lihat Tests\Support\ProyekUji): mulai 2026-01-01, Termin 1 target 30% tenggat 2026-03-31
 * (89 hari). Target ekspektasi pada hari ke-N = 30 x N / 89.
 */

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->proyek = ProyekUji::buat();
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
});

afterEach(fn () => Carbon::setTestNow());

function catatProgres($proyek, string $tanggal, float $persen): void
{
    $proyek->progresFisik()->create([
        'id_pelapor' => ProyekUji::user('AdminLapangan')->id_pengguna,
        'tanggal_lapor' => $tanggal,
        'persentase_realisasi' => $persen,
        'deskripsi_pekerjaan' => 'Uji',
    ]);
}

function catatKendala($proyek, string $kategori, string $keparahan, int $hari = 0, string $status = 'Aktif'): void
{
    $progres = $proyek->progresFisik()->latest('id_progres')->first();
    KendalaLapangan::create([
        'id_progres' => $progres->id_progres,
        'tanggal_kejadian' => '2026-02-10',
        'kategori_kendala' => $kategori,
        'tingkat_keparahan' => $keparahan,
        'deskripsi_kendala' => 'Uji',
        'estimasi_hari_tertunda' => $hari,
        'status_penanganan' => $status,
    ]);
}

function ambilEw($test)
{
    return $test->getJson("/api/projects/{$test->proyek->id_proyek}/early-warning")->assertStatus(200)->json('data');
}

test('UC-04 A1: progres sesuai kurva S tanpa kendala berat berstatus Aman', function () {
    Carbon::setTestNow('2026-02-14');           // hari ke-44 => target 14,83%
    catatProgres($this->proyek, '2026-02-14', 15);

    $ew = ambilEw($this);

    expect($ew['status'])->toBe('Aman')
        ->and($ew['progres']['target_ekspektasi'])->toBe(14.83)
        ->and($ew['progres']['deviasi_poin'])->toBe(0.17)
        ->and($ew['termin_berjalan']['nomor_termin'])->toBe(1)
        ->and($ew['termin_berjalan']['hari_ke_tenggat'])->toBe(45)
        ->and($ew['prediksi']['estimasi_hari_terlambat'])->toBe(0)
        ->and($ew['prediksi']['estimasi_kerugian'])->toEqual(0)
        ->and($ew['kurva_s']['target'])->toHaveCount(2)
        ->and($ew['rekomendasi']['sumber'])->toBe('rule');
});

test('UC-04: tertinggal melebihi toleransi berstatus Waspada', function () {
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 8);   // tertinggal 6,83 poin

    $ew = ambilEw($this);

    expect($ew['status'])->toBe('Waspada')
        ->and($ew['progres']['deviasi_poin'])->toBe(-6.83)
        ->and($ew['faktor_penyebab'][0])->toContain('tertinggal 6.83 poin');
});

test('UC-04: tertinggal 10 poin atau lebih berstatus Kritis', function () {
    Carbon::setTestNow('2026-03-15');           // hari ke-73 => target 24,61%
    catatProgres($this->proyek, '2026-03-15', 10);

    expect(ambilEw($this)['status'])->toBe('Kritis');
});

test('UC-04: tenggat terlewat sementara target belum tercapai berstatus Kritis', function () {
    Carbon::setTestNow('2026-04-05');
    catatProgres($this->proyek, '2026-04-05', 25);

    $ew = ambilEw($this);

    expect($ew['status'])->toBe('Kritis')
        ->and($ew['termin_berjalan']['hari_ke_tenggat'])->toBe(-5)
        ->and($ew['prediksi']['hari_terlambat_progres'])->toBeGreaterThanOrEqual(5)
        ->and($ew['faktor_penyebab'])->toContain('Tenggat termin sudah terlewat 5 hari dan target belum tercapai.');
});

test('UC-04: kendala Berat aktif memicu Waspada walau progres sesuai target', function () {
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 15);
    catatKendala($this->proyek, 'Cuaca', 'Berat', 0);

    $ew = ambilEw($this);

    expect($ew['status'])->toBe('Waspada')
        ->and($ew['skor_kendala'])->toBe(3)
        ->and($ew['rekomendasi']['teks'])->toContain('rencana cadangan');
});

test('UC-04: skor kendala aktif mencapai ambang kritis berstatus Kritis; kendala Resolved diabaikan', function () {
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 15);
    catatKendala($this->proyek, 'Material', 'Berat');
    catatKendala($this->proyek, 'Teknis', 'Berat');       // skor 3 + 3 = 6
    catatKendala($this->proyek, 'Cuaca', 'Berat', 9, 'Resolved');

    $ew = ambilEw($this);

    expect($ew['skor_kendala'])->toBe(6)
        ->and($ew['status'])->toBe('Kritis')
        ->and($ew['kendala_aktif'])->toHaveCount(2);
});

test('UC-04: estimasi hari terlambat dan kerugian dihitung dari laju progres + hari kendala', function () {
    Carbon::setTestNow('2026-03-01');
    catatProgres($this->proyek, '2026-02-01', 5);
    catatProgres($this->proyek, '2026-03-01', 12);       // laju 7/28 = 0,25 poin/hari
    catatKendala($this->proyek, 'Cuaca', 'Sedang', 3);

    $ew = ambilEw($this);

    // sisa 18 poin / 0,25 = 72 hari; tenggat 30 hari lagi => terlambat 42 hari + 3 hari kendala
    expect($ew['progres']['laju_per_hari'])->toBe(0.25)
        ->and($ew['prediksi']['hari_terlambat_progres'])->toBe(42)
        ->and($ew['prediksi']['hari_terlambat_kendala'])->toBe(3)
        ->and($ew['prediksi']['estimasi_hari_terlambat'])->toBe(45)
        ->and($ew['prediksi']['estimasi_kerugian'])->toEqual(13500000);   // 300 jt x 0,1% x 45 hari
});

test('UC-04: tanpa laporan progres, realisasi dianggap 0 dan laju rencana dipakai', function () {
    Carbon::setTestNow('2026-02-14');    // target ekspektasi 14,83 poin => tertinggal >= 10 poin => Kritis

    $ew = ambilEw($this);

    expect($ew['progres']['realisasi_terakhir'])->toEqual(0)
        ->and($ew['progres']['laju_per_hari'])->toBeNull()
        ->and($ew['prediksi']['hari_terlambat_progres'])->toBeGreaterThan(0)
        ->and($ew['status'])->toBe('Kritis');
});

test('UC-04: setelah termin 1 diajukan ke dinas, termin berjalan berpindah ke termin 2', function () {
    Carbon::setTestNow('2026-04-10');
    catatProgres($this->proyek, '2026-04-10', 35);
    $this->proyek->termin()->where('nomor_termin', 1)->update(['status_penagihan' => Termin::STATUS_DIAJUKAN]);

    $ew = ambilEw($this);

    expect($ew['termin_berjalan']['nomor_termin'])->toBe(2)
        ->and($ew['kurva_s']['target'][0]['persentase'])->toEqual(30);   // base = target termin 1
});

test('UC-04: semua termin cair => tidak ada termin berjalan dan status Aman', function () {
    Carbon::setTestNow('2026-04-10');
    $this->proyek->termin()->update(['status_penagihan' => Termin::STATUS_SP2D_CAIR]);

    $ew = ambilEw($this);

    expect($ew['status'])->toBe('Aman')
        ->and($ew['termin_berjalan'])->toBeNull()
        ->and($ew['rekomendasi']['teks'])->toContain('Seluruh termin telah dicairkan');
});

test('portofolio early warning hanya untuk Direktur dan Keuangan', function () {
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 8);

    $this->getJson('/api/early-warning')->assertStatus(200)
        ->assertJsonPath('data.ringkasan.total_proyek', 1)
        ->assertJsonPath('data.ringkasan.proyek_berisiko', 1)
        ->assertJsonPath('data.proyek.0.kode_proyek', 'P001')
        ->assertJsonPath('data.proyek.0.status', 'Waspada');

    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $this->getJson('/api/early-warning')->assertStatus(200);

    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $this->getJson('/api/early-warning')->assertStatus(403);
    $this->getJson("/api/projects/{$this->proyek->id_proyek}/early-warning")->assertStatus(200);
});

test('early warning proyek tidak ditemukan 404 dan tanpa token 401', function () {
    $this->getJson('/api/projects/9999/early-warning')->assertStatus(404);

    $this->app['auth']->forgetGuards();
    $this->withHeaders(['Authorization' => ''])->getJson('/api/early-warning')->assertStatus(401);
});

test('rekomendasi LLM (Groq) dipakai saat driver llm aktif, tanpa mengirim nama proyek/teks bebas', function () {
    config([
        'pantera.early_warning.driver' => 'llm',
        'pantera.llm.api_key' => 'kunci-uji',
    ]);
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 8);
    catatKendala($this->proyek, 'Cuaca', 'Berat', 3);

    Http::fake([
        'api.groq.com/*' => Http::response([
            'choices' => [[
                'index' => 0,
                'message' => ['role' => 'assistant', 'content' => 'Tambah shift malam untuk mengejar target termin 1.'],
            ]],
        ], 200),
    ]);

    $ew = ambilEw($this);

    expect($ew['rekomendasi'])->toBe([
        'teks' => 'Tambah shift malam untuk mengejar target termin 1.',
        'sumber' => 'llm',
    ]);

    Http::assertSent(function ($request) {
        return $request->url() === 'https://api.groq.com/openai/v1/chat/completions'
            && $request->hasHeader('Authorization', 'Bearer kunci-uji')
            && $request['model'] === 'openai/gpt-oss-20b'
            && $request['reasoning_effort'] === 'low'
            && $request['include_reasoning'] === false
            && $request['max_completion_tokens'] === 1024
            && $request['messages'][0]['role'] === 'system'
            && $request['messages'][1]['role'] === 'user'
            && ! str_contains($request->body(), 'Pembangunan Jembatan Uji')
            && ! str_contains($request->body(), 'sungai meluap');
    });
});

test('parameter reasoning tidak dikirim jika reasoning_effort dikosongkan (model non-reasoning)', function () {
    config([
        'pantera.early_warning.driver' => 'llm',
        'pantera.llm.api_key' => 'kunci-uji',
        'pantera.llm.reasoning_effort' => '',
    ]);
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 8);

    Http::fake(['api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => 'Saran uji.']]]], 200)]);

    expect(ambilEw($this)['rekomendasi']['sumber'])->toBe('llm');

    Http::assertSent(fn ($request) => ! isset($request['reasoning_effort']) && ! isset($request['include_reasoning']));
});

test('rekomendasi fallback ke aturan jika LLM error, jawaban kosong, atau kunci API kosong', function () {
    Carbon::setTestNow('2026-02-14');
    catatProgres($this->proyek, '2026-02-14', 8);
    config(['pantera.early_warning.driver' => 'llm', 'pantera.llm.api_key' => 'kunci-uji']);

    // 1) API gagal (mis. rate limit 429)
    Http::fake(['api.groq.com/*' => Http::response(['error' => ['message' => 'rate limit']], 429)]);
    expect(ambilEw($this)['rekomendasi']['sumber'])->toBe('rule');

    // 2) API sukses tetapi isi jawaban kosong (mis. token habis untuk reasoning)
    Http::fake(['api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => '']]]], 200)]);
    expect(ambilEw($this)['rekomendasi']['sumber'])->toBe('rule');

    // 3) driver llm tetapi tanpa API key => tidak ada request keluar
    config(['pantera.llm.api_key' => null]);
    Http::fake();
    expect(ambilEw($this)['rekomendasi']['sumber'])->toBe('rule');
    Http::assertNothingSent();
});
