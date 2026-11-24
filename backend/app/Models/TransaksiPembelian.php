<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransaksiPembelian extends Model
{
    use HasFactory;

    public const STATUS_DITERBITKAN = 'Diterbitkan';

    public const STATUS_DIPROSES = 'Diproses';

    public const STATUS_SELESAI = 'Selesai';

    protected $table = 'transaksi_pembelian';

    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'no_po',
        'id_request',
        'id_proyek',
        'id_direktur',
        'id_arsip_ref',
        'tanggal_po',
        'total_nominal',
        'status_po',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_po' => 'date:Y-m-d',
            'total_nominal' => 'decimal:2',
        ];
    }

    public function requestMaterial(): BelongsTo
    {
        return $this->belongsTo(RequestMaterial::class, 'id_request', 'id_request');
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class, 'id_proyek', 'id_proyek');
    }

    public function direktur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_direktur', 'id_pengguna');
    }

    public function arsipDokumen(): BelongsTo
    {
        return $this->belongsTo(ArsipDokumen::class, 'id_arsip_ref', 'id_arsip');
    }
}
