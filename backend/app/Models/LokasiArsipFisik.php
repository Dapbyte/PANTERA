<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LokasiArsipFisik extends Model
{
    use HasFactory;

    protected $table = 'lokasi_arsip_fisik';

    protected $primaryKey = 'id_lokasi';

    protected $fillable = [
        'id_arsip',
        'nomor_binder',
        'nomor_rak',
        'ruang_simpan',
        'keterangan_posisi',
    ];

    public function arsipDokumen(): BelongsTo
    {
        return $this->belongsTo(ArsipDokumen::class, 'id_arsip', 'id_arsip');
    }
}
