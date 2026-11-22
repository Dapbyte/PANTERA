<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VerifikasiDokumenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status_verifikasi' => ['required', 'boolean'],
            // Alasan wajib diisi bila verifikasi dicabut (status_verifikasi = false)
            'catatan_revisi' => ['required_if:status_verifikasi,false', 'nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status_verifikasi.required' => 'Status verifikasi wajib diisi.',
            'status_verifikasi.boolean' => 'Status verifikasi harus berupa true atau false.',
            'catatan_revisi.required_if' => 'Catatan revisi wajib diisi saat verifikasi dicabut.',
        ];
    }
}
