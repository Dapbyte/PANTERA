<?php

use App\Models\Proyek;
use App\Models\RequestMaterial;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    Storage::fake('public');
});

test('pengguna dapat mencatat arsip hibrida dengan koordinat fisik dan file digital (UC-11)', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    // Buat dummy proyek untuk relasi arsip
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    $proyek = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P001',
        'nama_proyek' => 'Proyek Gedung Serbaguna',
        'dinas_pemberi_kerja' => 'Dinas Perkim',
        'nilai_kontrak' => 500000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-06-30',
        'status_proyek' => 'Aktif',
    ]);

    $file = UploadedFile::fake()->create('dokumen_kontrak.pdf', 500, 'application/pdf');

    $payload = [
        'id_proyek' => $proyek->id_proyek,
        'nomor_surat' => '001/SPK/PANTERA/2026',
        'jenis_transaksi' => 'Pengadaan Material Konstruksi',
        'pihak_penyedia' => 'PT Semen Nusantara',
        'judul_dokumen' => 'Surat Perjanjian Kerja Pengadaan Material',
        'jenis_arsip' => 'Kontrak',
        'tanggal_arsip' => '2026-01-15',
        'tipe_penyimpanan' => 'Hibrida',
        'file_dokumen' => $file,
        'nomor_binder' => 'B-01',
        'nomor_rak' => 'RAK-03',
        'ruang_simpan' => 'Gudang Arsip Lantai 2',
        'keterangan_posisi' => 'Sisi kiri rak baris kedua',
    ];

    $response = $this->postJson('/api/archive', $payload);

    $response->assertStatus(201)
        ->assertJson([
            'status' => 'success',
            'message' => 'Arsip berhasil dicatat ke repositori.',
            'data' => [
                'arsip' => [
                    'nomor_surat' => '001/SPK/PANTERA/2026',
                    'tipe_penyimpanan' => 'Hibrida',
                    'lokasi_arsip_fisik' => [
                        'nomor_binder' => 'B-01',
                        'nomor_rak' => 'RAK-03',
                        'ruang_simpan' => 'Gudang Arsip Lantai 2',
                    ],
                ],
            ],
        ]);

    expect($response->json('data.label_stiker'))->toContain('LABEL-ARS-HBR-');

    $this->assertDatabaseHas('arsip_dokumen', [
        'nomor_surat' => '001/SPK/PANTERA/2026',
        'tipe_penyimpanan' => 'Hibrida',
    ]);

    $this->assertDatabaseHas('lokasi_arsip_fisik', [
        'nomor_binder' => 'B-01',
        'ruang_simpan' => 'Gudang Arsip Lantai 2',
    ]);
});

test('pencatatan arsip dapat menautkan referensi silang ke request material', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    $direktur = User::where('email', 'direktur@pantera.id')->first();
    $proyek = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P002',
        'nama_proyek' => 'Proyek Irigasi',
        'dinas_pemberi_kerja' => 'Dinas SDA',
        'nilai_kontrak' => 200000000.00,
        'tanggal_mulai' => '2026-02-01',
        'tanggal_selesai' => '2026-05-31',
        'status_proyek' => 'Aktif',
    ]);

    $requestMaterial = RequestMaterial::create([
        'no_request' => 'REQ-001',
        'id_proyek' => $proyek->id_proyek,
        'id_pengaju' => $lapangan->id_pengguna,
        'tanggal_pengajuan' => '2026-02-10',
        'sifat_pengajuan' => 'Rutin',
        'total_estimasi' => 50000000.00,
        'status_approval' => 'Pending',
    ]);

    $payload = [
        'id_proyek' => $proyek->id_proyek,
        'nomor_surat' => 'KWT/2026/02/099',
        'jenis_transaksi' => 'Pembelian Pasir & Semen',
        'pihak_penyedia' => 'TB Berkah Mandiri',
        'judul_dokumen' => 'Kuitansi Pembelian Semen 100 Sak',
        'jenis_arsip' => 'Kuitansi',
        'tanggal_arsip' => '2026-02-12',
        'tipe_penyimpanan' => 'Fisik',
        'nomor_binder' => 'B-02',
        'nomor_rak' => 'RAK-01',
        'ruang_simpan' => 'Ruang Administrasi',
        'id_request' => $requestMaterial->id_request,
    ];

    $response = $this->postJson('/api/archive', $payload);

    $response->assertStatus(201);

    $this->assertDatabaseHas('request_material', [
        'id_request' => $requestMaterial->id_request,
        'id_arsip_ref' => $response->json('data.arsip.id_arsip'),
    ]);
});

test('pencarian arsip berhasil menemukan dokumen yang cocok (UC-02 & SD-07)', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    $direktur = User::where('email', 'direktur@pantera.id')->first();
    $proyek = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P003',
        'nama_proyek' => 'Jembatan Citarum',
        'dinas_pemberi_kerja' => 'Bina Marga',
        'nilai_kontrak' => 800000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-08-31',
        'status_proyek' => 'Aktif',
    ]);

    $this->postJson('/api/archive', [
        'id_proyek' => $proyek->id_proyek,
        'nomor_surat' => 'BAST-001/P3/2026',
        'jenis_transaksi' => 'Serah Terima Progres',
        'pihak_penyedia' => 'PT Mandiri Teknik',
        'judul_dokumen' => 'Berita Acara Serah Terima Tahap 1',
        'jenis_arsip' => 'Berita Acara',
        'tanggal_arsip' => '2026-03-01',
        'tipe_penyimpanan' => 'Fisik',
        'nomor_binder' => 'B-05',
        'nomor_rak' => 'RAK-04',
        'ruang_simpan' => 'Lantai 1',
    ])->assertStatus(201);

    // Pencarian kata kunci 'Citarum'
    $response = $this->getJson('/api/archive/search?q=Citarum');

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Daftar arsip berhasil dimuat.',
        ])
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id_arsip',
                    'kode_arsip',
                    'judul_dokumen',
                    'lokasi_arsip_fisik',
                    'proyek',
                ],
            ],
        ]);
});

test('pencarian arsip mengembalikan 404 jika dokumen tidak ditemukan di repositori (SD-07)', function () {
    $keuangan = User::where('email', 'keuangan@pantera.id')->first();
    Sanctum::actingAs($keuangan);

    $response = $this->getJson('/api/archive/search?q=KataKunciYangTidakPernahAda123456');

    $response->assertStatus(404)
        ->assertJson([
            'status' => 'error',
            'message' => 'Arsip tidak ditemukan di repositori.',
        ]);
});

test('detail arsip dapat dilihat dan dihapus secara cascade', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $proyek = Proyek::create([
        'id_pembuat' => $direktur->id_pengguna,
        'kode_proyek' => 'P004',
        'nama_proyek' => 'Puskesmas Jonggol',
        'dinas_pemberi_kerja' => 'Dinkes',
        'nilai_kontrak' => 150000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-03-31',
        'status_proyek' => 'Aktif',
    ]);

    $createRes = $this->postJson('/api/archive', [
        'id_proyek' => $proyek->id_proyek,
        'nomor_surat' => 'FKTR-099/2026',
        'jenis_transaksi' => 'Faktur Pajak',
        'pihak_penyedia' => 'KPP Pratama',
        'judul_dokumen' => 'Faktur Pajak Pengadaan',
        'jenis_arsip' => 'Faktur',
        'tanggal_arsip' => '2026-02-01',
        'tipe_penyimpanan' => 'Fisik',
        'nomor_binder' => 'B-09',
        'nomor_rak' => 'RAK-09',
        'ruang_simpan' => 'Lantai 2',
    ])->assertStatus(201);

    $idArsip = $createRes->json('data.arsip.id_arsip');

    // Cek detail
    $detailRes = $this->getJson("/api/archive/{$idArsip}");
    $detailRes->assertOk()
        ->assertJson([
            'status' => 'success',
            'data' => [
                'id_arsip' => $idArsip,
                'nomor_surat' => 'FKTR-099/2026',
            ],
        ]);

    // Hapus arsip
    $deleteRes = $this->deleteJson("/api/archive/{$idArsip}");
    $deleteRes->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Dokumen arsip berhasil dihapus.',
        ]);

    $this->assertDatabaseMissing('arsip_dokumen', ['id_arsip' => $idArsip]);
    $this->assertDatabaseMissing('lokasi_arsip_fisik', ['id_arsip' => $idArsip]);
});
