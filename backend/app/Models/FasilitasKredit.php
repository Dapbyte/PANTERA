<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FasilitasKredit extends Model
{
    use HasFactory;

    public const STATUS_DIAJUKAN = 'Diajukan';

    public const STATUS_DISETUJUI = 'Disetujui';

    public const STATUS_DITOLAK = 'Ditolak';

    protected $table = 'fasilitas_kredit';

    protected $primaryKey = 'id_kredit';

    protected $fillable = [
        'id_proyek',
        'id_pencatat',
        'nama_bank',
        'nomor_fasilitas',
        'plafon_kredit',
        'suku_bunga',
        'tenor_bulan',
        'tanggal_koordinasi',
        'tanggal_jatuh_tempo_baru',
        'status_koordinasi',
        'catatan_kesepakatan',
    ];

    protected function casts(): array
    {
        return [
            'plafon_kredit' => 'decimal:2',
            'suku_bunga' => 'decimal:2',
            'tenor_bulan' => 'integer',
            'tanggal_koordinasi' => 'date:Y-m-d',
            'tanggal_jatuh_tempo_baru' => 'date:Y-m-d',
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
}
