<?php

use App\Models\Proyek;
use App\Models\RequestMaterial;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    Storage::fake('public');
});

/*
|--------------------------------------------------------------------------
| KLUSTER 1: AUTENTIKASI SANCTUM & RBAC (SD-01)
|--------------------------------------------------------------------------
*/

test('SD-01: login sukses mengembalikan token dan peran pengguna', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'direktur@pantera.id',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Login berhasil.',
            'data' => [
                'peran' => 'Direktur',
                'user' => [
                    'email' => 'direktur@pantera.id',
                    'nama' => 'Daniel Sipahutar',
                    'peran' => 'Direktur',
                ],
            ],
        ]);

    expect($response->json('data.token'))->not->toBeEmpty();
});

test('SD-01: login gagal 401 jika password salah atau akun dinonaktifkan', function () {
    // Password salah
    $resSalah = $this->postJson('/api/auth/login', [
        'email' => 'direktur@pantera.id',
        'password' => 'password_salah',
    ]);
    $resSalah->assertStatus(401)
        ->assertJson([
            'status' => 'error',
            'message' => 'Kredensial login tidak valid.',
        ]);

    // Akun nonaktif
    User::create([
        'nama' => 'User Nonaktif',
        'email' => 'nonaktif@pantera.id',
        'password_hash' => Hash::make('password123'),
        'peran' => 'AdminLapangan',
        'status_aktif' => false,
    ]);

    $resNonaktif = $this->postJson('/api/auth/login', [
        'email' => 'nonaktif@pantera.id',
        'password' => 'password123',
    ]);
    $resNonaktif->assertStatus(401)
        ->assertJson([
            'status' => 'error',
            'message' => 'Akun pengguna tidak aktif.',
        ]);
});

test('RBAC: admin lapangan dicegat 403 saat mencoba membuat proyek baru', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    $response = $this->postJson('/api/projects/new', [
        'nama_proyek' => 'Proyek Ilegal Lapangan',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'status' => 'error',
            'message' => 'Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.',
        ]);
});

/*
|--------------------------------------------------------------------------
| KLUSTER 2: PROJECT MANAGEMENT & RAB (UC-12 & SD-08)
|--------------------------------------------------------------------------
*/

test('UC-12 & SD-08: direktur sukses membuat proyek baru, RAB, dan termin berurutan', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $payload = [
        'nama_proyek' => 'Peningkatan Jalan Tol Jagorawi Seksi 3',
        'dinas_pemberi_kerja' => 'Kementerian PUPR',
        'nilai_kontrak' => 1500000000.00,
        'tanggal_mulai' => '2026-03-01',
        'tanggal_selesai' => '2026-12-31',
        'total_pagu' => 1350000000.00,
        'termin' => [
            [
                'nomor_termin' => 1,
                'target_persentase' => 20.0,
                'nilai_tagihan' => 300000000.00,
                'tenggat_waktu' => '2026-05-31',
            ],
            [
                'nomor_termin' => 2,
                'target_persentase' => 50.0,
                'nilai_tagihan' => 750000000.00,
                'tenggat_waktu' => '2026-09-30',
            ],
            [
                'nomor_termin' => 3,
                'target_persentase' => 30.0,
                'nilai_tagihan' => 450000000.00,
                'tenggat_waktu' => '2026-12-31',
            ],
        ],
    ];

    $response = $this->postJson('/api/projects/new', $payload);

    $response->assertStatus(201)
        ->assertJson([
            'status' => 'success',
            'message' => 'Proyek dan RAB berhasil dibuat.',
            'data' => [
                'kode_proyek' => 'P001',
                'nama_proyek' => 'Peningkatan Jalan Tol Jagorawi Seksi 3',
                'status_proyek' => 'Aktif',
                'rab' => [
                    'total_pagu' => '1350000000.00',
                    'sisa_pagu' => '1350000000.00',
                    'versi_rab' => '1',
                ],
            ],
        ]);

    // Verifikasi database: sisa_pagu == total_pagu
    $this->assertDatabaseHas('rab', [
        'total_pagu' => 1350000000.00,
        'sisa_pagu' => 1350000000.00,
    ]);

    // Verifikasi seluruh termin tersimpan
    $this->assertDatabaseCount('termin', 3);
});

test('SD-08: pembuatan proyek gagal 422 saat akumulasi termin tidak sama dengan nilai kontrak', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $payload = [
        'nama_proyek' => 'Proyek Selisih Tagihan',
        'dinas_pemberi_kerja' => 'Dinas Pekerjaan Umum',
        'nilai_kontrak' => 500000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-06-30',
        'total_pagu' => 450000000.00,
        'termin' => [
            [
                'nomor_termin' => 1,
                'target_persentase' => 50.0,
                'nilai_tagihan' => 200000000.00, // Total: 400jt != 500jt
                'tenggat_waktu' => '2026-03-31',
            ],
            [
                'nomor_termin' => 2,
                'target_persentase' => 50.0,
                'nilai_tagihan' => 200000000.00,
                'tenggat_waktu' => '2026-06-30',
            ],
        ],
    ];

    $response = $this->postJson('/api/projects', $payload);

    $response->assertStatus(422)
        ->assertJsonStructure([
            'status',
            'message',
            'errors' => ['termin'],
        ]);
});

/*
|--------------------------------------------------------------------------
| KLUSTER 3: HYBRID ARCHIVING MANAGEMENT (UC-02, UC-11 & SD-07)
|--------------------------------------------------------------------------
*/

test('UC-11: pencatatan arsip hibrida sukses menyimpan koordinat fisik dan file digital', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    $direktur = User::where('email', 'direktur@pantera.id')->first();
    $proyek = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P100',
        'nama_proyek' => 'Pembangunan Balai Pertemuan Warga',
        'dinas_pemberi_kerja' => 'Dispora',
        'nilai_kontrak' => 400000000.00,
        'tanggal_mulai' => '2026-02-01',
        'tanggal_selesai' => '2026-07-31',
        'status_proyek' => 'Aktif',
    ]);
    $proyek->adminLapanganAkses()->attach($lapangan->id_pengguna);

    $requestMaterial = RequestMaterial::create([
        'no_request' => 'REQ-MAT-99',
        'id_proyek' => $proyek->id_proyek,
        'id_pengaju' => $lapangan->id_pengguna,
        'tanggal_pengajuan' => '2026-02-15',
        'sifat_pengajuan' => 'Darurat',
        'total_estimasi' => 75000000.00,
        'status_approval' => 'Menunggu Direktur',
    ]);

    $file = UploadedFile::fake()->create('berita_acara.pdf', 300, 'application/pdf');

    $payload = [
        'id_proyek' => $proyek->id_proyek,
        'nomor_surat' => 'BA/2026/02/001',
        'jenis_transaksi' => 'Pengadaan Bata Ringan & Mortar',
        'pihak_penyedia' => 'PT Hebel Prima',
        'judul_dokumen' => 'Berita Acara Pembelian Material Darurat',
        'jenis_arsip' => 'Berita Acara',
        'tanggal_arsip' => '2026-02-16',
        'tipe_penyimpanan' => 'Hibrida',
        'file_dokumen' => $file,
        'nomor_binder' => 'BND-12',
        'nomor_rak' => 'RAK-02',
        'ruang_simpan' => 'Gudang Pusat',
        'keterangan_posisi' => 'Tingkat 3 sebelah kiri',
        'id_request' => $requestMaterial->id_request,
    ];

    $response = $this->postJson('/api/archive', $payload);

    $response->assertStatus(201)
        ->assertJson([
            'status' => 'success',
            'message' => 'Arsip berhasil dicatat ke repositori.',
        ]);

    expect($response->json('data.label_stiker'))->toContain('LABEL-ARS-HBR-');

    // Cek referensi silang ke request_material
    $this->assertDatabaseHas('request_material', [
        'id_request' => $requestMaterial->id_request,
        'id_arsip_ref' => $response->json('data.arsip.id_arsip'),
    ]);

    // Cek koordinat fisik
    $this->assertDatabaseHas('lokasi_arsip_fisik', [
        'nomor_binder' => 'BND-12',
        'nomor_rak' => 'RAK-02',
        'ruang_simpan' => 'Gudang Pusat',
    ]);
});

test('UC-02 & SD-07: pencarian arsip berhasil (200) dan mengembalikan 404 saat tidak ditemukan', function () {
    $keuangan = User::where('email', 'keuangan@pantera.id')->first();
    Sanctum::actingAs($keuangan);

    $direktur = User::where('email', 'direktur@pantera.id')->first();
    $proyek = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P101',
        'nama_proyek' => 'Pusat Distribusi Logistik',
        'dinas_pemberi_kerja' => 'Dinas Perdagangan',
        'nilai_kontrak' => 600000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-06-30',
        'status_proyek' => 'Aktif',
    ]);

    $this->postJson('/api/archive', [
        'id_proyek' => $proyek->id_proyek,
        'nomor_surat' => 'KW-LOG-01',
        'jenis_transaksi' => 'Kuitansi Pembayaran',
        'pihak_penyedia' => 'CV Sumber Rejeki',
        'judul_dokumen' => 'Kuitansi Sewa Alat Berat Excavator',
        'jenis_arsip' => 'Kuitansi',
        'tanggal_arsip' => '2026-02-20',
        'tipe_penyimpanan' => 'Fisik',
        'nomor_binder' => 'BND-01',
        'nomor_rak' => 'RAK-01',
        'ruang_simpan' => 'Lantai 1',
    ])->assertStatus(201);

    // 1. Pencarian ditemukan (200 OK)
    $resFound = $this->getJson('/api/archive/search?q=Excavator');
    $resFound->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Daftar arsip berhasil dimuat.',
        ]);

    // 2. Pencarian tidak ditemukan tetap mengembalikan 200 OK dengan items kosong (zero console 404)
    $resNotFound = $this->getJson('/api/archive/search?q=DokumenPalsuYangTidakAdaSamaSekali');
    $resNotFound->assertStatus(200)
        ->assertJson([
            'status' => 'success',
            'data' => [
                'items' => [],
                'meta' => [
                    'total' => 0,
                ],
            ],
        ]);
});
