<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rab extends Model
{
    use HasFactory;

    protected $table = 'rab';

    protected $primaryKey = 'id_rab';

    protected $fillable = [
        'id_proyek',
        'total_pagu',
        'sisa_pagu',
        'tanggal_ditetapkan',
        'versi_rab',
    ];

    protected function casts(): array
    {
        return [
            'total_pagu' => 'decimal:2',
            'sisa_pagu' => 'decimal:2',
            'tanggal_ditetapkan' => 'date:Y-m-d',
        ];
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class, 'id_proyek', 'id_proyek');
    }

    /**
     * Memeriksa apakah sisa pagu RAB mencukupi untuk nominal belanja tertentu.
     */
    public function cekKetersediaanPagu(float $nominal): bool
    {
        return $this->getSisaPagu() >= $nominal;
    }

    /**
     * Memotong sisa pagu RAB sesuai realisasi belanja yang telah disetujui.
     */
    public function updateRealisasi(float $nominal): void
    {
        $sisaBaru = max(0.0, round($this->getSisaPagu() - $nominal, 2));
        $this->update(['sisa_pagu' => $sisaBaru]);
    }

    /**
     * Mengambil nilai numerik sisa pagu RAB saat ini.
     */
    public function getSisaPagu(): float
    {
        return (float) $this->sisa_pagu;
    }
}
