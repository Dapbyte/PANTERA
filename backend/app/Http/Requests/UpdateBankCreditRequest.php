<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBankCreditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nama_bank' => ['sometimes', 'required', 'string', 'max:255'],
            'nomor_fasilitas' => ['nullable', 'string', 'max:100'],
            'plafon_kredit' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'suku_bunga' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tenor_bulan' => ['sometimes', 'required', 'integer', 'min:1', 'max:360'],
            'tanggal_koordinasi' => ['sometimes', 'date'],
            'tanggal_jatuh_tempo_baru' => ['nullable', 'date'],
            'status_koordinasi' => ['sometimes', 'required', 'in:Diajukan,Disetujui,Ditolak'],
            'catatan_kesepakatan' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
