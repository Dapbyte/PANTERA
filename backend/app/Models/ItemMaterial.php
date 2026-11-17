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
}
