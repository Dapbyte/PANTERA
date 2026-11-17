<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed data awal sistem PANTERA untuk 3 akun utama.
     */
    public function run(): void
    {
        // 1. Akun Direktur
        User::updateOrCreate(
            ['email' => 'direktur@pantera.id'],
            [
                'nama' => 'Daniel Sipahutar',
                'password_hash' => Hash::make('password123'),
                'peran' => 'Direktur',
                'status_aktif' => true,
                'divisi' => 'Direksi',
                'batas_approval_nominal' => 500000000.00,
            ]
        );

        // 2. Akun Sekretaris / Keuangan
        User::updateOrCreate(
            ['email' => 'keuangan@pantera.id'],
            [
                'nama' => 'Rita',
                'password_hash' => Hash::make('password123'),
                'peran' => 'SekretarisKeuangan',
                'status_aktif' => true,
                'divisi' => 'Keuangan & Administrasi',
                'batas_verifikasi_kas' => 100000000.00,
            ]
        );

        // 3. Akun Admin Lapangan
        User::updateOrCreate(
            ['email' => 'lapangan@pantera.id'],
            [
                'nama' => 'Odd Dellarobia',
                'password_hash' => Hash::make('password123'),
                'peran' => 'AdminLapangan',
                'status_aktif' => true,
                'lokasi_tugas' => 'Proyek Konstruksi Lapangan',
                'nomor_kontak' => '081234567890',
            ]
        );
    }
}
