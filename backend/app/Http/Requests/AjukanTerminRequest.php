<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AjukanTerminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi pengajuan tagihan ke dinas (UC-06).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nomor_surat_serah' => ['required', 'string', 'max:255'],
            'tanggal_pengajuan' => ['nullable', 'date', 'before_or_equal:today'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nomor_surat_serah.required' => 'Nomor surat penyerahan tagihan wajib diisi.',
            'tanggal_pengajuan.before_or_equal' => 'Tanggal pengajuan tidak boleh di masa depan.',
        ];
    }
}
