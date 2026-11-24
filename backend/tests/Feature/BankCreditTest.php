<?php

use App\Models\FasilitasKredit;
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

test('UC-05: Sekretaris/Keuangan dapat mencatat dan memperbarui koordinasi kredit bank', function () {
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));

    $created = $this->postJson('/api/bank-credits', [
        'id_proyek' => $this->proyek->id_proyek,
        'nama_bank' => 'Bank BNI',
        'nomor_fasilitas' => 'BNI-KM-2026-01',
        'plafon_kredit' => 250000000,
        'suku_bunga' => 9.5,
        'tenor_bulan' => 12,
        'tanggal_koordinasi' => '2026-03-20',
        'tanggal_jatuh_tempo_baru' => '2027-03-20',
        'catatan_kesepakatan' => 'Pengajuan perpanjangan tenor akibat deviasi cuaca.',
    ])->assertStatus(201)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.nama_bank', 'Bank BNI')
        ->assertJsonPath('data.status_koordinasi', 'Diajukan');

    $idKredit = $created->json('data.id_kredit');

    $this->patchJson("/api/bank-credits/{$idKredit}", [
        'status_koordinasi' => 'Disetujui',
        'tenor_bulan' => 18,
        'catatan_kesepakatan' => 'Disetujui perpanjangan tenor menjadi 18 bulan.',
    ])->assertStatus(200)
        ->assertJsonPath('data.status_koordinasi', 'Disetujui')
        ->assertJsonPath('data.tenor_bulan', 18);

    $this->getJson('/api/bank-credits?status_koordinasi=Disetujui')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id_kredit', $idKredit);

    expect(FasilitasKredit::count())->toBe(1);
});

test('UC-05: Direktur dan Sekretaris dapat mengunduh ringkasan laporan performa proyek untuk bank', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $this->postJson("/api/projects/{$this->proyek->id_proyek}/progress", [
        'persentase_realisasi' => 22,
        'deskripsi_pekerjaan' => 'Pekerjaan pondasi selesai sebagian',
        'tanggal_lapor' => '2026-03-19',
    ])->assertStatus(201);

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->postJson('/api/bank-credits', [
        'id_proyek' => $this->proyek->id_proyek,
        'nama_bank' => 'Bank BCA',
        'plafon_kredit' => 150000000,
        'tenor_bulan' => 6,
    ])->assertStatus(201);

    $this->getJson("/api/projects/{$this->proyek->id_proyek}/performance-report")
        ->assertStatus(200)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.proyek_detail.proyek.id_proyek', $this->proyek->id_proyek)
        ->assertJsonPath('data.early_warning.id_proyek', $this->proyek->id_proyek)
        ->assertJsonCount(1, 'data.riwayat_progres')
        ->assertJsonCount(1, 'data.fasilitas_kredit');

    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $this->getJson("/api/projects/{$this->proyek->id_proyek}/performance-report")->assertStatus(200);
});

test('RBAC & validasi: AdminLapangan ditolak mengakses endpoint koordinasi bank', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $this->getJson('/api/bank-credits')->assertStatus(403);
    $this->postJson('/api/bank-credits', [])->assertStatus(403);
    $this->getJson("/api/projects/{$this->proyek->id_proyek}/performance-report")->assertStatus(403);

    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $this->postJson('/api/bank-credits', [
        'id_proyek' => $this->proyek->id_proyek,
        'nama_bank' => 'BRI',
        'plafon_kredit' => 1000000,
        'tenor_bulan' => 6,
    ])->assertStatus(403);

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->getJson('/api/projects/99999/performance-report')->assertStatus(404);
    $this->patchJson('/api/bank-credits/99999', ['status_koordinasi' => 'Disetujui'])->assertStatus(404);
});
