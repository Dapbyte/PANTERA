<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBankCreditRequest extends FormRequest
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
            'id_proyek' => ['required', 'integer', 'exists:proyek,id_proyek'],
            'nama_bank' => ['required', 'string', 'max:255'],
            'nomor_fasilitas' => ['nullable', 'string', 'max:100'],
            'plafon_kredit' => ['required', 'numeric', 'gt:0'],
            'suku_bunga' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tenor_bulan' => ['required', 'integer', 'min:1', 'max:360'],
            'tanggal_koordinasi' => ['nullable', 'date'],
            'tanggal_jatuh_tempo_baru' => ['nullable', 'date'],
            'status_koordinasi' => ['sometimes', 'in:Diajukan,Disetujui,Ditolak'],
            'catatan_kesepakatan' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_proyek.required' => 'Proyek wajib dipilih.',
            'nama_bank.required' => 'Nama bank mitra wajib diisi.',
            'plafon_kredit.required' => 'Plafon kredit wajib diisi.',
            'plafon_kredit.gt' => 'Plafon kredit harus lebih besar dari 0.',
            'tenor_bulan.required' => 'Tenor bulan wajib diisi.',
            'tenor_bulan.min' => 'Tenor minimal 1 bulan.',
        ];
    }
}
