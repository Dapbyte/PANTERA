<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'must_change_password',
        'lokasi_tugas',
        'nomor_kontak',
        'divisi',
    ];

    /**
     * Atribut yang disembunyikan saat serialisasi JSON.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
        'batas_verifikasi_kas',
        'batas_approval_nominal',
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
            'must_change_password' => 'boolean',
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
     * Cek apakah user diizinkan mengakses suatu proyek (GLB-14).
     */
    public function canAccessProyek(int $idProyek): bool
    {
        if (! $this->isAdminLapangan()) {
            return true;
        }

        return $this->proyekAkses()
            ->where('proyek.id_proyek', $idProyek)
            ->exists();
    }

    /**
     * Daftar ID proyek yang boleh diakses Admin Lapangan (atau null untuk Direktur/Keuangan).
     *
     * @return list<int>|null
     */
    public function allowedProyekIds(): ?array
    {
        if (! $this->isAdminLapangan()) {
            return null;
        }

        return $this->proyekAkses()
            ->pluck('proyek.id_proyek')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    /**
     * Relasi akses proyek khusus Admin Lapangan (GLB-14).
     */
    public function proyekAkses(): BelongsToMany
    {
        return $this->belongsToMany(
            Proyek::class,
            'proyek_pengguna',
            'id_pengguna',
            'id_proyek'
        )->withTimestamps();
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

    /**
     * Relasi ke status pembacaan notifikasi per modul.
     */
    public function notifikasiBaca(): HasMany
    {
        return $this->hasMany(NotifikasiBaca::class, 'id_pengguna', 'id_pengguna');
    }
}
