<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Akses role nanti diatur lewat route
        return true;
    }

    public function rules(): array
    {
        return [
            'id_proyek' => ['required', 'integer', 'exists:proyek,id_proyek'],
            'sifat_pengajuan' => ['required', 'in:Rutin,Darurat'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.nama_material' => ['required', 'string'],
            'items.*.volume' => ['required', 'numeric', 'gt:0'],
            'items.*.satuan' => ['required', 'string'],
            'items.*.estimasi_harga' => ['required', 'numeric', 'gte:0'],
        ];
    }
}