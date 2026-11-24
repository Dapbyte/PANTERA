<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('direktur dapat membuat proyek baru beserta rab dan termin (UC-12 & SD-08)', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $payload = [
        'nama_proyek' => 'Pembangunan Saluran Irigasi Sekunder',
        'dinas_pemberi_kerja' => 'Dinas PUPR Kabupaten Bogor',
        'nilai_kontrak' => 1000000000.00,
        'tanggal_mulai' => '2026-03-01',
        'tanggal_selesai' => '2026-08-31',
        'total_pagu' => 900000000.00,
        'termin' => [
            [
                'nomor_termin' => 1,
                'target_persentase' => 30.0,
                'nilai_tagihan' => 300000000.00,
                'tenggat_waktu' => '2026-04-30',
            ],
            [
                'nomor_termin' => 2,
                'target_persentase' => 40.0,
                'nilai_tagihan' => 400000000.00,
                'tenggat_waktu' => '2026-06-30',
            ],
            [
                'nomor_termin' => 3,
                'target_persentase' => 30.0,
                'nilai_tagihan' => 300000000.00,
                'tenggat_waktu' => '2026-08-31',
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
                'nama_proyek' => 'Pembangunan Saluran Irigasi Sekunder',
                'nilai_kontrak' => '1000000000.00',
                'rab' => [
                    'total_pagu' => '900000000.00',
                    'sisa_pagu' => '900000000.00',
                    'versi_rab' => '1',
                ],
            ],
        ]);

    $this->assertDatabaseHas('proyek', [
        'kode_proyek' => 'P001',
        'status_proyek' => 'Aktif',
    ]);

    $this->assertDatabaseHas('rab', [
        'total_pagu' => 900000000.00,
        'sisa_pagu' => 900000000.00,
    ]);

    $this->assertDatabaseCount('termin', 3);
});

test('pembuatan proyek gagal 422 jika akumulasi termin tidak sama dengan nilai kontrak', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $payload = [
        'nama_proyek' => 'Pembangunan Jembatan Desa',
        'dinas_pemberi_kerja' => 'Dinas Bina Marga',
        'nilai_kontrak' => 500000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-06-30',
        'total_pagu' => 450000000.00,
        'termin' => [
            [
                'nomor_termin' => 1,
                'target_persentase' => 50.0,
                'nilai_tagihan' => 200000000.00, // Total tagihan: 200jt + 250jt = 450jt != 500jt
                'tenggat_waktu' => '2026-03-31',
            ],
            [
                'nomor_termin' => 2,
                'target_persentase' => 50.0,
                'nilai_tagihan' => 250000000.00,
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

test('pembuatan proyek gagal 422 jika tenggat termin berada di luar rentang kontrak', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $payload = [
        'nama_proyek' => 'Pembangunan Gedung Arsip',
        'dinas_pemberi_kerja' => 'Diskominfo',
        'nilai_kontrak' => 100000000.00,
        'tanggal_mulai' => '2026-02-01',
        'tanggal_selesai' => '2026-05-31',
        'total_pagu' => 90000000.00,
        'termin' => [
            [
                'nomor_termin' => 1,
                'target_persentase' => 100.0,
                'nilai_tagihan' => 100000000.00,
                'tenggat_waktu' => '2026-07-01', // Di luar batas 2026-05-31
            ],
        ],
    ];

    $response = $this->postJson('/api/projects', $payload);

    $response->assertStatus(422)
        ->assertJsonStructure([
            'status',
            'message',
            'errors' => ['termin.0.tenggat_waktu'],
        ]);
});

test('admin lapangan dilarang membuat proyek oleh rbac (403 Forbidden)', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    $response = $this->postJson('/api/projects', [
        'nama_proyek' => 'Proyek Ilegal Lapangan',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'status' => 'error',
            'message' => 'Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.',
        ]);
});

test('semua peran terautentikasi dapat melihat katalog daftar proyek', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $lapangan = User::where('email', 'lapangan@pantera.id')->first();

    // Buat 1 proyek terlebih dahulu dan berikan akses ke Admin Lapangan
    $this->postJson('/api/projects', [
        'nama_proyek' => 'Renovasi Puskesmas Sentul',
        'dinas_pemberi_kerja' => 'Dinas Kesehatan',
        'nilai_kontrak' => 300000000.00,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-04-30',
        'total_pagu' => 270000000.00,
        'admin_lapangan_ids' => [(int) $lapangan->id_pengguna],
        'termin' => [
            [
                'nomor_termin' => 1,
                'target_persentase' => 100.0,
                'nilai_tagihan' => 300000000.00,
                'tenggat_waktu' => '2026-04-30',
            ],
        ],
    ])->assertStatus(201);

    // Login sebagai Admin Lapangan dan akses katalog proyek
    Sanctum::actingAs($lapangan);

    $response = $this->getJson('/api/projects?q=Sentul');

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Katalog daftar proyek berhasil dimuat.',
        ])
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id_proyek',
                    'kode_proyek',
                    'nama_proyek',
                    'nilai_kontrak',
                    'ringkasan_rab',
                    'posisi_termin_berjalan',
                    'progres_fisik_terakhir',
                ],
            ],
        ]);
});

test('detail proyek dapat diakses dan mengembalikan 404 jika tidak ditemukan', function () {
    $keuangan = User::where('email', 'keuangan@pantera.id')->first();
    Sanctum::actingAs($keuangan);

    $notFoundResponse = $this->getJson('/api/projects/99999');
    $notFoundResponse->assertStatus(404)
        ->assertJson([
            'status' => 'error',
            'message' => 'Proyek tidak ditemukan.',
        ]);
});
