<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('login berhasil dengan kredensial yang valid', function () {
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
                ],
            ],
        ]);

    expect($response->json('data.token'))->not->toBeNull();
});

test('login gagal jika password salah', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'direktur@pantera.id',
        'password' => 'password_salah',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'status' => 'error',
            'message' => 'Kredensial login tidak valid.',
        ]);
});

test('login gagal jika akun berstatus tidak aktif', function () {
    User::create([
        'nama' => 'User Nonaktif',
        'email' => 'nonaktif@pantera.id',
        'password_hash' => Hash::make('password123'),
        'peran' => 'AdminLapangan',
        'status_aktif' => false,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'nonaktif@pantera.id',
        'password' => 'password123',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'status' => 'error',
            'message' => 'Akun pengguna tidak aktif.',
        ]);
});

test('get profile me berhasil bagi user terautentikasi', function () {
    $user = User::where('email', 'keuangan@pantera.id')->first();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'data' => [
                'email' => 'keuangan@pantera.id',
                'peran' => 'SekretarisKeuangan',
            ],
        ]);
});

test('direktur dapat melihat daftar seluruh pengguna', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $response = $this->getJson('/api/users');

    $response->assertOk()
        ->assertJsonStructure([
            'status',
            'message',
            'data' => [
                '*' => ['id_pengguna', 'nama', 'email', 'peran'],
            ],
        ]);
});

test('admin lapangan dilarang mengakses daftar pengguna oleh rbac', function () {
    $lapangan = User::where('email', 'lapangan@pantera.id')->first();
    Sanctum::actingAs($lapangan);

    $response = $this->getJson('/api/users');

    $response->assertStatus(403)
        ->assertJson([
            'status' => 'error',
            'message' => 'Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.',
        ]);
});

test('direktur dapat menambahkan pengguna baru', function () {
    $direktur = User::where('email', 'direktur@pantera.id')->first();
    Sanctum::actingAs($direktur);

    $response = $this->postJson('/api/users', [
        'nama' => 'Staff Lapangan Baru',
        'email' => 'lapanganbaru@pantera.id',
        'password' => 'password123',
        'peran' => 'AdminLapangan',
        'lokasi_tugas' => 'Proyek Bintaro',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'status' => 'success',
            'message' => 'Pengguna baru berhasil ditambahkan.',
            'data' => [
                'nama' => 'Staff Lapangan Baru',
                'email' => 'lapanganbaru@pantera.id',
                'peran' => 'AdminLapangan',
            ],
        ]);

    $this->assertDatabaseHas('pengguna', [
        'email' => 'lapanganbaru@pantera.id',
    ]);
});

test('user dapat memperbarui profilnya', function () {
    $user = User::where('email', 'keuangan@pantera.id')->first();
    Sanctum::actingAs($user);

    $response = $this->putJson('/api/auth/profile', [
        'nama' => 'Rita Wijaya',
        'nomor_kontak' => '08987654321',
    ]);

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data' => [
                'nama' => 'Rita Wijaya',
                'nomor_kontak' => '08987654321',
            ],
        ]);

    expect($user->fresh()->nama)->toBe('Rita Wijaya');
});

test('logout berhasil mencabut access token', function () {
    $user = User::where('email', 'lapangan@pantera.id')->first();
    $token = $user->createToken('test_token')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/auth/logout');

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Logout berhasil.',
        ]);

    expect($user->tokens()->count())->toBe(0);
});
