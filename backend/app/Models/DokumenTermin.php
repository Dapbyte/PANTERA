<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenTermin extends Model
{
    use HasFactory;

    protected $table = 'dokumen_termin';

    protected $primaryKey = 'id_dokumen';

    protected $fillable = [
        'id_termin',
        'jenis_dokumen',
        'path_file',
        'status_verifikasi',
        'catatan_revisi',
    ];

    protected function casts(): array
    {
        return [
            'status_verifikasi' => 'boolean',
        ];
    }

    public function termin(): BelongsTo
    {
        return $this->belongsTo(Termin::class, 'id_termin', 'id_termin');
    }
}
