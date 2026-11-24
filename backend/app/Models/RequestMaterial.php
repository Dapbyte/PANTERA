<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RequestMaterial extends Model
{
    use HasFactory;

    public const STATUS_DIAJUKAN = 'Diajukan';

    public const STATUS_PERLU_REVISI = 'Perlu Revisi';

    public const STATUS_MENUNGGU_DIREKTUR = 'Menunggu Direktur';

    public const STATUS_SELESAI = 'Selesai';

    // Alias konstanta lama untuk kompatibilitas referensi internal
    public const STATUS_PENDING = self::STATUS_DIAJUKAN;

    public const STATUS_TERVALIDASI_KEUANGAN = self::STATUS_MENUNGGU_DIREKTUR;

    public const STATUS_DISETUJUI = self::STATUS_SELESAI;

    public const STATUS_REVISI = self::STATUS_PERLU_REVISI;

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
        'tanggal_butuh',
        'sifat_pengajuan',
        'total_estimasi',
        'status_approval',
        'catatan_direktur',
        'catatan_keuangan',
        'catatan_lapangan',
        'alasan_penolakan',
        'melebihi_rab',
        'skema_pembayaran',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengajuan' => 'date:Y-m-d',
            'tanggal_butuh' => 'date:Y-m-d',
            'total_estimasi' => 'decimal:2',
            'melebihi_rab' => 'boolean',
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

    public function transaksiPembelian(): HasOne
    {
        return $this->hasOne(TransaksiPembelian::class, 'id_request', 'id_request');
    }

    public function riwayatRevisi(): HasMany
    {
        return $this->hasMany(RiwayatRevisiMaterial::class, 'id_request', 'id_request')
            ->orderByDesc('id_revisi');
    }
}
