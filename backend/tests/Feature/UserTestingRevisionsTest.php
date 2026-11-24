<?php

use App\Models\MitraBank;
use App\Models\Proyek;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\ProyekUji;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('GLB-13: Direktur membuat akun dengan password sementara dan pekerja wajib mengganti password saat login pertama', function () {
    $direktur = ProyekUji::user('Direktur');
    Sanctum::actingAs($direktur);

    $res = $this->postJson('/api/users', [
        'nama' => 'Mandor Lapangan Baru',
        'email' => 'mandor@pantera.id',
        'peran' => 'AdminLapangan',
        'lokasi_tugas' => 'Zona Selatan',
    ])->assertStatus(201);

    $tempPassword = $res->json('data.temporary_password');
    expect($tempPassword)->toBeString()->not->toBeEmpty()
        ->and($res->json('data.must_change_password'))->toBeTrue();

    // Login pakai password sementara
    $loginRes = $this->postJson('/api/auth/login', [
        'email' => 'mandor@pantera.id',
        'password' => $tempPassword,
    ])->assertStatus(200)
        ->assertJsonPath('data.user.must_change_password', true);

    $token = $loginRes->json('data.token');

    // Clear in-memory Sanctum actingAs user from Direktur setup before authenticating with worker Bearer token
    $this->app['auth']->forgetGuards();

    // Ganti password pertama kali
    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/change-password', [
            'password' => 'rahasiaBaru123',
            'password_confirmation' => 'rahasiaBaru123',
        ])->assertStatus(200)
        ->assertJsonPath('data.must_change_password', false);

    // Login dengan password baru berhasil
    $this->postJson('/api/auth/login', [
        'email' => 'mandor@pantera.id',
        'password' => 'rahasiaBaru123',
    ])->assertStatus(200)
        ->assertJsonPath('data.user.must_change_password', false);
});

test('DIR-07 & DIR-08: Direktur dapat mengubah peran pengguna dan menghapus akun tanpa riwayat', function () {
    $direktur = ProyekUji::user('Direktur');
    Sanctum::actingAs($direktur);

    $user = User::create([
        'nama' => 'Akun Sementara',
        'email' => 'tempuser@pantera.id',
        'password_hash' => Hash::make('secret123'),
        'peran' => 'AdminLapangan',
        'status_aktif' => true,
    ]);

    $this->patchJson("/api/users/{$user->id_pengguna}", [
        'peran' => 'SekretarisKeuangan',
    ])->assertStatus(200)
        ->assertJsonPath('data.peran', 'SekretarisKeuangan');

    $this->deleteJson("/api/users/{$user->id_pengguna}")
        ->assertStatus(200);

    $this->assertDatabaseMissing('pengguna', ['id_pengguna' => $user->id_pengguna]);

    // Direktur tidak boleh hapus dirinya sendiri
    $this->deleteJson("/api/users/{$direktur->id_pengguna}")
        ->assertStatus(422);
});

test('GLB-14: Admin Lapangan hanya melihat proyek yang diberi akses oleh Direktur dan ditolak 403 untuk proyek lain', function () {
    $direktur = ProyekUji::user('Direktur');
    $lapangan = ProyekUji::user('AdminLapangan');

    $proyekTerbuka = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P201',
        'nama_proyek' => 'Proyek Diizinkan',
        'dinas_pemberi_kerja' => 'PUPR',
        'nilai_kontrak' => 100000000,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-06-30',
        'status_proyek' => 'Aktif',
    ]);
    $proyekTerbuka->rab()->create([
        'total_pagu' => 90000000,
        'sisa_pagu' => 90000000,
        'tanggal_ditetapkan' => '2026-01-01',
        'versi_rab' => '1',
    ]);
    $proyekTerbuka->adminLapanganAkses()->attach($lapangan->id_pengguna);

    $proyekTerkunci = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P202',
        'nama_proyek' => 'Proyek Rahasia Lain',
        'dinas_pemberi_kerja' => 'PUPR',
        'nilai_kontrak' => 200000000,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-06-30',
        'status_proyek' => 'Aktif',
    ]);

    Sanctum::actingAs($lapangan);

    $listRes = $this->getJson('/api/projects')->assertStatus(200);
    expect($listRes->json('data'))->toHaveCount(1)
        ->and($listRes->json('data.0.kode_proyek'))->toBe('P201');

    $this->getJson("/api/projects/{$proyekTerbuka->id_proyek}")->assertStatus(200);
    $this->getJson("/api/projects/{$proyekTerkunci->id_proyek}")->assertStatus(403);
    $this->postJson('/api/material-requests', [
        'id_proyek' => $proyekTerkunci->id_proyek,
        'sifat_pengajuan' => 'Rutin',
        'items' => [['nama_material' => 'Pasir', 'volume' => 1, 'satuan' => 'm3']],
    ])->assertStatus(403);
});

test('DIR-03: Direktur dapat mengedit dan menghapus proyek beserta turunannya', function () {
    $proyek = ProyekUji::buat();
    $direktur = ProyekUji::user('Direktur');
    Sanctum::actingAs($direktur);

    $termins = $proyek->termin()->orderBy('nomor_termin')->get();

    $this->putJson("/api/projects/{$proyek->id_proyek}", [
        'nama_proyek' => 'Jembatan Uji Revisi',
        'dinas_pemberi_kerja' => 'Dinas Bina Marga Provinsi',
        'nilai_kontrak' => 1200000000,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-12-31',
        'status_proyek' => 'Aktif',
        'total_pagu' => 1000000000,
        'termin' => [
            ['id_termin' => $termins[0]->id_termin, 'nomor_termin' => 1, 'target_persentase' => 50, 'nilai_tagihan' => 600000000, 'tenggat_waktu' => '2026-06-30'],
            ['id_termin' => $termins[1]->id_termin, 'nomor_termin' => 2, 'target_persentase' => 50, 'nilai_tagihan' => 600000000, 'tenggat_waktu' => '2026-12-31'],
        ],
    ])->assertStatus(200)
        ->assertJsonPath('data.nama_proyek', 'Jembatan Uji Revisi')
        ->assertJsonPath('data.rab.total_pagu', '1000000000.00');

    expect($proyek->termin()->count())->toBe(2);

    $this->deleteJson("/api/projects/{$proyek->id_proyek}")
        ->assertStatus(200);

    $this->assertDatabaseMissing('proyek', ['id_proyek' => $proyek->id_proyek]);
});

test('KEU-07 & GLB-05: mitra bank dinamis dapat dikelola dan notification badge hilang setelah seen', function () {
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));

    $created = $this->postJson('/api/mitra-bank', [
        'nama_bank' => 'Bank Syariah Indonesia',
        'kontak' => 'Cabang Surabaya',
    ])->assertStatus(201);

    $idBank = $created->json('data.id_bank');

    $this->patchJson("/api/mitra-bank/{$idBank}", [
        'nama_bank' => 'Bank BSI Regional',
        'kontak' => '031-5551234',
    ])->assertStatus(200)
        ->assertJsonPath('data.nama_bank', 'Bank BSI Regional');

    $this->deleteJson("/api/mitra-bank/{$idBank}")->assertStatus(200);
    expect(MitraBank::where('nama_bank', 'Bank BSI Regional')->exists())->toBeFalse();

    // Uji notification summary & seen
    $proyek = ProyekUji::buat();
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $this->travel(2)->seconds();
    $this->postJson('/api/material-requests', [
        'id_proyek' => $proyek->id_proyek,
        'sifat_pengajuan' => 'Rutin',
        'items' => [['nama_material' => 'Batu Kali', 'volume' => 10, 'satuan' => 'm3']],
    ])->assertStatus(201);

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $summary = $this->getJson('/api/notifications/summary')->assertStatus(200);
    expect($summary->json('data.badges.beranda'))->toBeTrue();

    $this->travel(2)->seconds();
    $this->postJson('/api/notifications/seen', ['modul' => 'beranda'])->assertStatus(200);

    $afterSeen = $this->getJson('/api/notifications/summary')->assertStatus(200);
    expect($afterSeen->json('data.badges.beranda'))->toBeFalse();
});

test('multi-foto progres fisik dan kendala lapangan tersimpan dalam foto_paths serta path_foto pertama', function () {
    Storage::fake('public');
    $proyek = ProyekUji::buat();
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $progRes = $this->postJson("/api/projects/{$proyek->id_proyek}/progress", [
        'persentase_realisasi' => 25,
        'deskripsi_pekerjaan' => 'Pemasangan tulangan beton kolom',
        'fotos' => [
            UploadedFile::fake()->image('prog-1.jpg', 100, 100),
            UploadedFile::fake()->image('prog-2.png', 100, 100),
        ],
    ])->assertStatus(201);

    $progData = $progRes->json('data.progres');
    expect($progData['foto_paths'])->toBeArray()->toHaveCount(2)
        ->and($progData['path_foto'])->toBe($progData['foto_paths'][0]);
    foreach ($progData['foto_paths'] as $path) {
        Storage::disk('public')->assertExists($path);
    }

    $kendalaRes = $this->postJson("/api/projects/{$proyek->id_proyek}/kendala", [
        'kategori_kendala' => 'Cuaca',
        'tingkat_keparahan' => 'Berat',
        'deskripsi_kendala' => 'Hujan deras dan genangan air area pondasi',
        'estimasi_hari_tertunda' => 2,
        'fotos' => [
            UploadedFile::fake()->image('kendala-1.jpg', 100, 100),
            UploadedFile::fake()->image('kendala-2.jpg', 100, 100),
        ],
    ])->assertStatus(201);

    $kendalaData = $kendalaRes->json('data.kendala');
    expect($kendalaData['foto_paths'])->toBeArray()->toHaveCount(2)
        ->and($kendalaData['path_foto'])->toBe($kendalaData['foto_paths'][0]);
    foreach ($kendalaData['foto_paths'] as $path) {
        Storage::disk('public')->assertExists($path);
    }

    $ewRes = $this->getJson("/api/projects/{$proyek->id_proyek}/early-warning")->assertStatus(200);
    expect($ewRes->json('data.kurva_s.target_proyek'))->toBeArray()->toHaveCount(4)
        ->and($ewRes->json('data.kendala_aktif.0.foto_paths'))->toHaveCount(2);
});

test('endpoint preview berkas dokumen termin dan filter proyek arsip + RBAC hapus arsip berjalan sesuai aturan', function () {
    Storage::fake('public');
    $direktur = ProyekUji::user('Direktur');
    $keuangan = ProyekUji::user('SekretarisKeuangan');
    $lapangan = ProyekUji::user('AdminLapangan');

    $proyekA = ProyekUji::buat();
    // Buat proyek B tanpa akses AdminLapangan
    Sanctum::actingAs($direktur);
    $proyekB = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P999',
        'nama_proyek' => 'Proyek B Privat',
        'dinas_pemberi_kerja' => 'Dinas Perhubungan',
        'nilai_kontrak' => 500000000,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-12-31',
        'status_proyek' => 'Aktif',
    ]);
    $proyekB->rab()->create([
        'total_pagu' => 450000000,
        'sisa_pagu' => 450000000,
        'tanggal_ditetapkan' => '2026-01-01',
        'versi_rab' => '1',
    ]);

    $terminA = $proyekA->termin()->where('nomor_termin', 1)->firstOrFail();

    // AdminLapangan mengunggah dokumen pada Proyek A
    Sanctum::actingAs($lapangan);
    $upRes = $this->postJson("/api/termin/{$terminA->id_termin}/dokumen", [
        'jenis_dokumen' => 'laporan_mingguan',
        'file_dokumen' => UploadedFile::fake()->create('laporan.pdf', 50, 'application/pdf'),
    ])->assertStatus(201);
    $idDokA = $upRes->json('data.dokumen.id_dokumen');

    // File termin dapat dipratinjau Keuangan, Direktur, dan AdminLapangan terotorisasi
    foreach ([$lapangan, $keuangan, $direktur] as $actor) {
        Sanctum::actingAs($actor);
        $this->get("/api/termin/{$terminA->id_termin}/dokumen/{$idDokA}/file")->assertStatus(200);
        $this->get("/api/termin/{$terminA->id_termin}/dokumen/{$idDokA}/file?download=1")->assertStatus(200);
    }

    // AdminLapangan yang tidak ditugaskan mendapat 403
    $lapanganLain = User::create([
        'nama' => 'Admin Lain',
        'email' => 'adminlain@pantera.id',
        'password_hash' => Hash::make('secret123'),
        'peran' => 'AdminLapangan',
        'status_aktif' => true,
    ]);
    Sanctum::actingAs($lapanganLain);
    $this->get("/api/termin/{$terminA->id_termin}/dokumen/{$idDokA}/file")->assertStatus(403);

    // Arsip pada proyek A dan B + filter id_proyek + RBAC hapus (hanya Direktur)
    Sanctum::actingAs($direktur);
    $arsipARes = $this->postJson('/api/archive', [
        'id_proyek' => $proyekA->id_proyek,
        'nomor_surat' => 'SRT-A-01',
        'jenis_transaksi' => 'Administrasi',
        'pihak_penyedia' => 'Internal',
        'judul_dokumen' => 'Arsip Proyek A',
        'jenis_arsip' => 'Surat',
        'tanggal_arsip' => '2026-02-01',
        'tipe_penyimpanan' => 'Fisik',
        'nomor_binder' => '01',
        'nomor_rak' => 'R1',
        'ruang_simpan' => 'Gedung A',
    ])->assertStatus(201);
    $idArsipA = $arsipARes->json('data.arsip.id_arsip');

    $this->postJson('/api/archive', [
        'id_proyek' => $proyekB->id_proyek,
        'nomor_surat' => 'SRT-B-01',
        'jenis_transaksi' => 'Administrasi',
        'pihak_penyedia' => 'Internal',
        'judul_dokumen' => 'Arsip Proyek B',
        'jenis_arsip' => 'Surat',
        'tanggal_arsip' => '2026-02-02',
        'tipe_penyimpanan' => 'Fisik',
        'nomor_binder' => '02',
        'nomor_rak' => 'R2',
        'ruang_simpan' => 'Gedung B',
    ])->assertStatus(201);

    Sanctum::actingAs($keuangan);
    $filtered = $this->getJson("/api/archive?id_proyek={$proyekB->id_proyek}")->assertStatus(200);
    expect($filtered->json('data.items'))->toHaveCount(1)
        ->and($filtered->json('data.items.0.nomor_surat'))->toBe('SRT-B-01');

    // RBAC hapus: Keuangan & AdminLapangan 403; Direktur 200
    $this->deleteJson("/api/archive/{$idArsipA}")->assertStatus(403);
    Sanctum::actingAs($lapangan);
    $this->deleteJson("/api/archive/{$idArsipA}")->assertStatus(403);
    Sanctum::actingAs($direktur);
    $this->deleteJson("/api/archive/{$idArsipA}")->assertStatus(200);
});
