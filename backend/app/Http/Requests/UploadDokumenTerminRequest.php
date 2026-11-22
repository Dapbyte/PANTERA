<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadDokumenTerminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi unggah bukti termin (UC-10).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'jenis_dokumen' => ['required', Rule::in(array_keys(config('pantera.dokumen_termin_wajib')))],
            'file_dokumen' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'jenis_dokumen.required' => 'Jenis dokumen wajib dipilih.',
            'jenis_dokumen.in' => 'Jenis dokumen tidak dikenal. Gunakan: '.implode(', ', array_keys(config('pantera.dokumen_termin_wajib'))).'.',
            'file_dokumen.required' => 'File dokumen wajib diunggah.',
            'file_dokumen.mimes' => 'Format file dokumen harus berupa PDF, JPG, JPEG, atau PNG.',
            'file_dokumen.max' => 'Ukuran file dokumen maksimal 10 MB.',
        ];
    }
}
