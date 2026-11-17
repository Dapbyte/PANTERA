<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Proyek extends Model
{
    use HasFactory;

    protected $table = 'proyek';

    protected $primaryKey = 'id_proyek';

    protected $fillable = [
        'id_pembuat',
        'kode_proyek',
        'nama_proyek',
        'dinas_pemberi_kerja',
        'nilai_kontrak',
        'tanggal_mulai',
        'tanggal_selesai',
        'status_proyek',
    ];

    protected function casts(): array
    {
        return [
            'nilai_kontrak' => 'decimal:2',
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pembuat', 'id_pengguna');
    }

    public function rab(): HasOne
    {
        return $this->hasOne(Rab::class, 'id_proyek', 'id_proyek');
    }

    public function termin(): HasMany
    {
        return $this->hasMany(Termin::class, 'id_proyek', 'id_proyek');
    }

    public function arsipDokumen(): HasMany
    {
        return $this->hasMany(ArsipDokumen::class, 'id_proyek', 'id_proyek');
    }

    public function requestMaterial(): HasMany
    {
        return $this->hasMany(RequestMaterial::class, 'id_proyek', 'id_proyek');
    }

    public function progresFisik(): HasMany
    {
        return $this->hasMany(ProgresFisik::class, 'id_proyek', 'id_proyek');
    }
}
