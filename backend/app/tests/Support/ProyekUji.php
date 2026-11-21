<?php

namespace tests\Support;

use App\Models\Proyek;
use App\Models\User;
use App\Services\ProjectService;

/**
 * Helper data uji: proyek dengan 3 termin kumulatif (30% / 70% / 100%).
 *
 *   mulai 2026-01-01
 *   Termin 1: target 30%,  tenggat 2026-03-31, tagihan Rp300.000.000
 *   Termin 2: target 70%,  tenggat 2026-07-31, tagihan Rp400.000.000
 *   Termin 3: target 100%, tenggat 2026-12-31, tagihan Rp300.000.000
 */

class ProyekUji
{
    public static function buat(): Proyek
    {
        $direktur = User::where('email', 'direktur@pantera.id')->firstOrFail();

        return app(ProjectService::class)->createProject([
            'nama_proyek' => 'Pembangunan Jembatan Uji',
            'dinas_pemberi_kerja' => 'Dinas PUPR Uji',
            'nilai_kontrak' => 1000000000,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
            'total_pagu' => 900000000,
            'termin' => [
                ['nomor_termin' => 1, 'target_persentase' => 30, 'nilai_tagihan' => 300000000, 'tenggat_waktu' => '2026-03-31'],
                ['nomor_termin' => 2, 'target_persentase' => 70, 'nilai_tagihan' => 400000000, 'tenggat_waktu' => '2026-07-31'],
                ['nomor_termin' => 3, 'target_persentase' => 100, 'nilai_tagihan' => 300000000, 'tenggat_waktu' => '2026-12-31'],
            ],
        ], (int) $direktur->id_pengguna)->refresh();
    }

    public static function user(string $peran): User
    {
        $email = [
            'Direktur' => 'direktur@pantera.id',
            'SekretarisKeuangan' => 'keuangan@pantera.id',
            'AdminLapangan' => 'lapangan@pantera.id',
        ][$peran];

        return User::where('email', $email)->firstOrFail();
    }
}