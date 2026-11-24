<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatRevisiMaterial extends Model
{
    public $timestamps = false;

    protected $table = 'riwayat_revisi_material';

    protected $primaryKey = 'id_revisi';

    protected $fillable = [
        'id_request',
        'id_pengguna',
        'peran',
        'aksi',
        'alasan',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function requestMaterial(): BelongsTo
    {
        return $this->belongsTo(RequestMaterial::class, 'id_request', 'id_request');
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pengguna', 'id_pengguna');
    }
}
