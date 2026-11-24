<?php

namespace Database\Seeders;

use App\Models\MitraBank;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed data awal sistem PANTERA untuk 3 akun utama & daftar mitra bank.
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
                'must_change_password' => false,
                'divisi' => 'Direksi',
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
                'must_change_password' => false,
                'divisi' => 'Keuangan & Administrasi',
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
                'must_change_password' => false,
                'lokasi_tugas' => 'Proyek Konstruksi Lapangan',
                'nomor_kontak' => '081234567890',
            ]
        );

        // 4. Mitra Perbankan Kredit Konstruksi default (KEU-07)
        $defaultBanks = [
            'Bank BNI',
            'Bank BCA',
            'Bank BRI',
            'Bank BTN',
            'Bank Jatim',
        ];

        foreach ($defaultBanks as $bank) {
            MitraBank::updateOrCreate(['nama_bank' => $bank]);
        }
    }
}
