<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RequestMaterial extends Model
{
    use HasFactory;

    protected $table = 'request_material';

    protected $primaryKey = 'id_request';

    protected $fillable = [
        'no_request',
        'id_proyek',
        'id_pengaju',
        'id_validator',
        'id_direktur',
        'id_arsip_ref',
        'tanggal_pengajuan',
        'sifat_pengajuan',
        'total_estimasi',
        'status_approval',
        'catatan_direktur',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengajuan' => 'date:Y-m-d',
            'total_estimasi' => 'decimal:2',
        ];
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class, 'id_proyek', 'id_proyek');
    }

    public function pengaju(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pengaju', 'id_pengguna');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_validator', 'id_pengguna');
    }

    public function direktur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_direktur', 'id_pengguna');
    }

    public function arsipDokumen(): BelongsTo
    {
        return $this->belongsTo(ArsipDokumen::class, 'id_arsip_ref', 'id_arsip');
    }

    public function itemMaterial(): HasMany
    {
        return $this->hasMany(ItemMaterial::class, 'id_request', 'id_request');
    }
}
