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
}
