<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemMaterial extends Model
{
    use HasFactory;

    protected $table = 'item_material';

    protected $primaryKey = 'id_item';

    protected $fillable = [
        'id_request',
        'nama_material',
        'volume',
        'satuan',
        'estimasi_harga',
        'ketersediaan_vendor',
        'vendor_nama',
        'vendor_pengganti',
    ];

    protected function casts(): array
    {
        return [
            'volume' => 'double',
            'estimasi_harga' => 'decimal:2',
            'ketersediaan_vendor' => 'boolean',
        ];
    }

    public function requestMaterial(): BelongsTo
    {
        return $this->belongsTo(RequestMaterial::class, 'id_request', 'id_request');
    }

    /**
     * Menghitung subtotal item material (volume * estimasi_harga).
     */
    public function hitungSubtotal(): float
    {
        if ($this->estimasi_harga === null) {
            return 0.0;
        }

        return round((float) $this->volume * (float) $this->estimasi_harga, 2);
    }
}
