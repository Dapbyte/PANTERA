<?php

use App\Models\ArsipDokumen;
use App\Models\ItemMaterial;
use App\Models\Rab;
use App\Models\TransaksiPembelian;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Support\ProyekUji;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    Carbon::setTestNow('2026-03-20');
    $this->proyek = ProyekUji::buat(); // total_pagu = 900.000.000
});

afterEach(fn () => Carbon::setTestNow());

test('Alur Baru Lapangan: input volume + satuan tanpa harga, total_estimasi null & harga disembunyikan', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    // Meski pengirim mencoba mengirim estimasi_harga, backend mengabaikannya
    $response = $this->postJson('/api/material-requests', [
        'id_proyek' => $this->proyek->id_proyek,
        'sifat_pengajuan' => 'Darurat',
        'tanggal_butuh' => '2026-03-25',
        'catatan_lapangan' => 'Kebutuhan pengecoran tahap 1',
        'items' => [
            ['nama_material' => 'Semen PCC 50 kg', 'volume' => 200, 'satuan' => 'sak', 'estimasi_harga' => 999999],
            ['nama_material' => 'Besi Ulir D16', 'volume' => 100, 'satuan' => 'batang'],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.status_approval', 'Diajukan')
        ->assertJsonPath('data.sifat_pengajuan', 'Darurat')
        ->assertJsonPath('data.tanggal_butuh', '2026-03-25')
        ->assertJsonPath('data.total_estimasi', null)
        ->assertJsonPath('data.item_material.0.estimasi_harga', null)
        ->assertJsonPath('data.item_material.1.estimasi_harga', null);

    expect($response->json('data.no_request'))->toStartWith('REQ-20260320-')
        ->and($response->json('data.riwayat_revisi'))->toHaveCount(1)
        ->and($response->json('data.riwayat_revisi.0.aksi'))->toBe('Diajukan');

    $itemPertama = ItemMaterial::first();
    expect($itemPertama->estimasi_harga)->toBeNull()
        ->and($itemPertama->hitungSubtotal())->toBe(0.0);
});

test('Keuangan mengisi vendor (tersedia/pengganti) dan harga satuan lalu meneruskan ke Direktur, harga tetap tersembunyi untuk Lapangan', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $created = $this->postJson('/api/material-requests', [
        'id_proyek' => $this->proyek->id_proyek,
        'sifat_pengajuan' => 'Rutin',
        'tanggal_butuh' => '2026-03-28',
        'items' => [
            ['nama_material' => 'Semen PCC', 'volume' => 200, 'satuan' => 'sak'],
            ['nama_material' => 'Besi Beton', 'volume' => 100, 'satuan' => 'batang'],
        ],
    ])->assertStatus(201)->json('data');

    $idReq = $created['id_request'];
    $idItem1 = $created['item_material'][0]['id_item'];
    $idItem2 = $created['item_material'][1]['id_item'];

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));

    // Item 2 vendor tidak tersedia -> wajib isi vendor_pengganti (jika kosong ditolak 422)
    $this->patchJson("/api/material-requests/{$idReq}/validate", [
        'keputusan' => 'Setuju',
        'skema_pembayaran' => 'Kas',
        'items' => [
            ['id_item' => $idItem1, 'ketersediaan_vendor' => true, 'vendor_nama' => 'TB Nusantara', 'harga_satuan' => 75000],
            ['id_item' => $idItem2, 'ketersediaan_vendor' => false, 'harga_satuan' => 150000],
        ],
    ])->assertStatus(422)
        ->assertJsonValidationErrors('items.1.vendor_pengganti', 'errors');

    // Valid dengan vendor & harga lengkap (total: 200*75rb + 100*150rb = 30.000.000)
    $validated = $this->patchJson("/api/material-requests/{$idReq}/validate", [
        'keputusan' => 'Setuju',
        'skema_pembayaran' => 'Kas',
        'catatan_keuangan' => 'Vendor besi dialihkan ke supplier cadangan',
        'items' => [
            ['id_item' => $idItem1, 'ketersediaan_vendor' => true, 'vendor_nama' => 'TB Nusantara', 'harga_satuan' => 75000],
            ['id_item' => $idItem2, 'ketersediaan_vendor' => false, 'vendor_pengganti' => 'PT Baja Sejahtera', 'harga_satuan' => 150000],
        ],
    ]);

    $validated->assertStatus(200)
        ->assertJsonPath('data.status_approval', 'Menunggu Direktur')
        ->assertJsonPath('data.total_estimasi', '30000000.00')
        ->assertJsonPath('data.melebihi_rab', false)
        ->assertJsonPath('data.item_material.0.vendor_nama', 'TB Nusantara')
        ->assertJsonPath('data.item_material.1.vendor_pengganti', 'PT Baja Sejahtera');

    // Admin Lapangan TIDAK BOLEH melihat harga di list maupun detail
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $this->getJson("/api/material-requests/{$idReq}")
        ->assertOk()
        ->assertJsonPath('data.total_estimasi', null)
        ->assertJsonPath('data.sisa_pagu_rab', null)
        ->assertJsonPath('data.item_material.0.estimasi_harga', null)
        ->assertJsonPath('data.item_material.1.estimasi_harga', null);

    // Direktur melihat volume DAN harga lengkap sebelum approve
    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $this->getJson("/api/material-requests/{$idReq}")
        ->assertOk()
        ->assertJsonPath('data.total_estimasi', '30000000.00')
        ->assertJsonPath('data.item_material.0.estimasi_harga', '75000.00')
        ->assertJsonPath('data.item_material.1.vendor_pengganti', 'PT Baja Sejahtera');
});

test('Keuangan dapat menolak dengan alasan menjadi Perlu Revisi, tercatat di riwayat, lalu Lapangan mengajukan ulang', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $idReq = $this->postJson('/api/material-requests', [
        'id_proyek' => $this->proyek->id_proyek,
        'sifat_pengajuan' => 'Rutin',
        'tanggal_butuh' => '2026-03-29',
        'items' => [['nama_material' => 'Semen', 'volume' => 100, 'satuan' => 'sak']],
    ])->assertStatus(201)->json('data.id_request');

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));

    $this->patchJson("/api/material-requests/{$idReq}/validate", [
        'keputusan' => 'Revisi',
    ])->assertStatus(422)
        ->assertJsonValidationErrors('alasan_penolakan', 'errors');

    $this->patchJson("/api/material-requests/{$idReq}/validate", [
        'keputusan' => 'Revisi',
        'alasan_penolakan' => 'Kurangi volume semen menjadi 50 sak.',
    ])->assertStatus(200)
        ->assertJsonPath('data.status_approval', 'Perlu Revisi')
        ->assertJsonPath('data.alasan_penolakan', 'Kurangi volume semen menjadi 50 sak.');

    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $revised = $this->putJson("/api/material-requests/{$idReq}", [
        'sifat_pengajuan' => 'Rutin',
        'tanggal_butuh' => '2026-03-30',
        'catatan_lapangan' => 'Volume disesuaikan menjadi 50 sak',
        'items' => [['nama_material' => 'Semen', 'volume' => 50, 'satuan' => 'sak']],
    ]);

    $revised->assertStatus(200)
        ->assertJsonPath('data.status_approval', 'Diajukan')
        ->assertJsonPath('data.alasan_penolakan', null);

    expect($revised->json('data.riwayat_revisi'))->toHaveCount(3);
});

test('Direktur menyetujui pengajuan menjadi Selesai, memotong sisa pagu RAB, dan menerbitkan PO (termasuk saat melebihi RAB ditandai khusus)', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $arsip = ArsipDokumen::create([
        'id_proyek' => $this->proyek->id_proyek,
        'id_pencatat' => ProyekUji::user('AdminLapangan')->id_pengguna,
        'nomor_surat' => 'FP-001',
        'jenis_transaksi' => 'Faktur Pengadaan',
        'pihak_penyedia' => 'PT Semen Nusantara',
        'kode_arsip' => 'ARS-FSK-20260320-001',
        'judul_dokumen' => 'Penawaran Harga Material',
        'jenis_arsip' => 'Faktur',
        'tanggal_arsip' => '2026-03-20',
        'tipe_penyimpanan' => 'Fisik',
    ]);

    $created = $this->postJson('/api/material-requests', [
        'id_proyek' => $this->proyek->id_proyek,
        'sifat_pengajuan' => 'Darurat',
        'items' => [['nama_material' => 'Beton K-350', 'volume' => 50, 'satuan' => 'm³']],
    ])->assertStatus(201)->json('data');

    $idReq = $created['id_request'];
    $idItem = $created['item_material'][0]['id_item'];

    // Uji melebihi pagu (50 * 20.000.000 = 1.000.000.000 > 900.000.000) -> tetap bisa diteruskan dengan flag melebihi_rab = true (tanpa cek batas kas/approval)
    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->patchJson("/api/material-requests/{$idReq}/validate", [
        'keputusan' => 'Setuju',
        'skema_pembayaran' => 'Kredit',
        'items' => [
            ['id_item' => $idItem, 'ketersediaan_vendor' => true, 'vendor_nama' => 'PT Beton Jaya', 'harga_satuan' => 20000000],
        ],
    ])->assertStatus(200)
        ->assertJsonPath('data.status_approval', 'Menunggu Direktur')
        ->assertJsonPath('data.melebihi_rab', true);

    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $res = $this->patchJson("/api/material-requests/{$idReq}/approve", [
        'keputusan' => 'Disetujui',
        'catatan_direktur' => 'Disetujui khusus untuk pekerjaan kritis.',
        'id_arsip_ref' => $arsip->id_arsip,
    ]);

    $res->assertStatus(200)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.status_approval', 'Selesai')
        ->assertJsonPath('data.melebihi_rab', true)
        ->assertJsonPath('data.id_arsip_ref', $arsip->id_arsip)
        ->assertJsonPath('data.transaksi_pembelian.status_po', 'Diterbitkan');

    expect($res->json('data.transaksi_pembelian.no_po'))->toStartWith('PO-20260320-');

    $rab = Rab::where('id_proyek', $this->proyek->id_proyek)->firstOrFail();
    expect($rab->getSisaPagu())->toBe(0.0)
        ->and(TransaksiPembelian::where('id_request', $idReq)->exists())->toBeTrue();
});

test('Direktur menolak menjadi Perlu Revisi tidak memotong RAB dan tidak menerbitkan PO', function () {
    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));

    $created = $this->postJson('/api/material-requests', [
        'id_proyek' => $this->proyek->id_proyek,
        'sifat_pengajuan' => 'Rutin',
        'items' => [['nama_material' => 'Cat', 'volume' => 10, 'satuan' => 'unit']],
    ])->assertStatus(201)->json('data');

    $idReq = $created['id_request'];
    $idItem = $created['item_material'][0]['id_item'];

    Sanctum::actingAs(ProyekUji::user('SekretarisKeuangan'));
    $this->patchJson("/api/material-requests/{$idReq}/validate", [
        'keputusan' => 'Setuju',
        'skema_pembayaran' => 'Kas',
        'items' => [
            ['id_item' => $idItem, 'ketersediaan_vendor' => true, 'vendor_nama' => 'Toko Warna', 'harga_satuan' => 500000],
        ],
    ])->assertStatus(200);

    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $this->patchJson("/api/material-requests/{$idReq}/approve", [
        'keputusan' => 'Revisi',
    ])->assertStatus(422)
        ->assertJsonValidationErrors('alasan_penolakan', 'errors');

    $this->patchJson("/api/material-requests/{$idReq}/approve", [
        'keputusan' => 'Revisi',
        'alasan_penolakan' => 'Kurangi jumlah unit terlebih dahulu.',
    ])->assertStatus(200)
        ->assertJsonPath('data.status_approval', 'Perlu Revisi');

    $rab = Rab::where('id_proyek', $this->proyek->id_proyek)->firstOrFail();
    expect($rab->getSisaPagu())->toBe(900000000.0)
        ->and(TransaksiPembelian::count())->toBe(0);
});

test('RBAC: otorisasi peran pada alur material ditegakkan', function () {
    $this->getJson('/api/material-requests')->assertStatus(401);

    Sanctum::actingAs(ProyekUji::user('Direktur'));
    $this->postJson('/api/material-requests', [])->assertStatus(403);

    Sanctum::actingAs(ProyekUji::user('AdminLapangan'));
    $idReq = $this->postJson('/api/material-requests', [
        'id_proyek' => $this->proyek->id_proyek,
        'sifat_pengajuan' => 'Rutin',
        'items' => [['nama_material' => 'Paku', 'volume' => 10, 'satuan' => 'kg']],
    ])->assertStatus(201)->json('data.id_request');

    $this->patchJson("/api/material-requests/{$idReq}/validate", ['keputusan' => 'Revisi', 'alasan_penolakan' => 'x'])->assertStatus(403);
    $this->patchJson("/api/material-requests/{$idReq}/approve", ['keputusan' => 'Disetujui'])->assertStatus(403);
});
