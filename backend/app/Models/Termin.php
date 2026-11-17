<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Termin extends Model
{
    use HasFactory;

    protected $table = 'termin';

    protected $primaryKey = 'id_termin';

    protected $fillable = [
        'id_proyek',
        'nomor_termin',
        'target_persentase',
        'nilai_tagihan',
        'tenggat_waktu',
        'status_penagihan',
        'estimasi_kerugian',
        'tanggal_pengajuan',
        'nomor_surat_serah',
        'nomor_sp2d',
        'tanggal_cair',
    ];

    protected function casts(): array
    {
        return [
            'nomor_termin' => 'integer',
            'target_persentase' => 'double',
            'nilai_tagihan' => 'decimal:2',
            'estimasi_kerugian' => 'decimal:2',
            'tenggat_waktu' => 'date:Y-m-d',
            'tanggal_pengajuan' => 'date:Y-m-d',
            'tanggal_cair' => 'date:Y-m-d',
        ];
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class, 'id_proyek', 'id_proyek');
    }

    public function dokumenTermin(): HasMany
    {
        return $this->hasMany(DokumenTermin::class, 'id_termin', 'id_termin');
    }
}
