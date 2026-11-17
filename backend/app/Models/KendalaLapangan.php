<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KendalaLapangan extends Model
{
    use HasFactory;

    protected $table = 'kendala_lapangan';

    protected $primaryKey = 'id_kendala';

    protected $fillable = [
        'id_progres',
        'tanggal_kejadian',
        'kategori_kendala',
        'tingkat_keparahan',
        'deskripsi_kendala',
        'estimasi_hari_tertunda',
        'status_penanganan',
        'tanggal_resolved',
        'catatan_penyelesaian',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_kejadian' => 'date:Y-m-d',
            'tanggal_resolved' => 'date:Y-m-d',
            'estimasi_hari_tertunda' => 'integer',
        ];
    }

    public function progresFisik(): BelongsTo
    {
        return $this->belongsTo(ProgresFisik::class, 'id_progres', 'id_progres');
    }
}
