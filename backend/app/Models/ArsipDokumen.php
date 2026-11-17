<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ArsipDokumen extends Model
{
    use HasFactory;

    protected $table = 'arsip_dokumen';

    protected $primaryKey = 'id_arsip';

    protected $fillable = [
        'id_proyek',
        'id_pencatat',
        'nomor_surat',
        'jenis_transaksi',
        'pihak_penyedia',
        'kode_arsip',
        'judul_dokumen',
        'jenis_arsip',
        'tanggal_arsip',
        'tipe_penyimpanan',
        'path_digital',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_arsip' => 'date:Y-m-d',
        ];
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class, 'id_proyek', 'id_proyek');
    }

    public function pencatat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pencatat', 'id_pengguna');
    }

    public function lokasiArsipFisik(): HasOne
    {
        return $this->hasOne(LokasiArsipFisik::class, 'id_arsip', 'id_arsip');
    }

    public function requestMaterial(): HasMany
    {
        return $this->hasMany(RequestMaterial::class, 'id_arsip_ref', 'id_arsip');
    }
}
