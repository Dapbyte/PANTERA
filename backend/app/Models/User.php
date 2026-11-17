<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Nama tabel di database.
     *
     * @var string
     */
    protected $table = 'pengguna';

    /**
     * Primary key tabel.
     *
     * @var string
     */
    protected $primaryKey = 'id_pengguna';

    /**
     * Kolom yang dapat diisi secara mass-assignment.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nama',
        'email',
        'password_hash',
        'peran',
        'status_aktif',
        'lokasi_tugas',
        'nomor_kontak',
        'divisi',
        'batas_verifikasi_kas',
        'batas_approval_nominal',
    ];

    /**
     * Atribut yang disembunyikan saat serialisasi JSON.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * Nama kolom password untuk autentikasi Laravel.
     */
    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    /**
     * Casting tipe data atribut.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status_aktif' => 'boolean',
            'batas_verifikasi_kas' => 'decimal:2',
            'batas_approval_nominal' => 'decimal:2',
            'password_hash' => 'hashed',
        ];
    }

    /**
     * Helper cek peran.
     */
    public function isAdminLapangan(): bool
    {
        return $this->peran === 'AdminLapangan';
    }

    public function isSekretarisKeuangan(): bool
    {
        return $this->peran === 'SekretarisKeuangan';
    }

    public function isDirektur(): bool
    {
        return $this->peran === 'Direktur';
    }

    /**
     * Relasi ke Proyek yang dibuat oleh user ini.
     */
    public function proyekDibuat(): HasMany
    {
        return $this->hasMany(Proyek::class, 'id_pembuat', 'id_pengguna');
    }

    /**
     * Relasi ke Arsip yang dicatat oleh user ini.
     */
    public function arsipDicatat(): HasMany
    {
        return $this->hasMany(ArsipDokumen::class, 'id_pencatat', 'id_pengguna');
    }

    /**
     * Relasi ke Request Material yang diajukan oleh user ini.
     */
    public function materialDiajukan(): HasMany
    {
        return $this->hasMany(RequestMaterial::class, 'id_pengaju', 'id_pengguna');
    }

    /**
     * Relasi ke Progres Fisik yang dilaporkan oleh user ini.
     */
    public function progresDilaporkan(): HasMany
    {
        return $this->hasMany(ProgresFisik::class, 'id_pelapor', 'id_pengguna');
    }
}
