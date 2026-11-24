<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MitraBank extends Model
{
    use HasFactory;

    protected $table = 'mitra_bank';

    protected $primaryKey = 'id_bank';

    protected $fillable = [
        'nama_bank',
        'kontak',
        'catatan',
    ];
}
