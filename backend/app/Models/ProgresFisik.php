<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgresFisik extends Model
{
    use HasFactory;

    protected $table = 'progres_fisik';

    protected $primaryKey = 'id_progres';

    protected $fillable = [
        'id_proyek',
        'id_pelapor',
        'tanggal_lapor',
        'persentase_realisasi',
        'deskripsi_pekerjaan',
        'path_foto',
        'verifikasi_pengawas',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_lapor' => 'date:Y-m-d',
            'persentase_realisasi' => 'double',
            'verifikasi_pengawas' => 'boolean',
        ];
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class, 'id_proyek', 'id_proyek');
    }

    public function pelapor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pelapor', 'id_pengguna');
    }

    public function kendalaLapangan(): HasMany
    {
        return $this->hasMany(KendalaLapangan::class, 'id_progres', 'id_progres');
    }
}
