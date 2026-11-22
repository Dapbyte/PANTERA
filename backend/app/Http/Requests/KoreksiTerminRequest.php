<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class KoreksiTerminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi koreksi administratif dari dinas (UC-06 A1).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'catatan_koreksi_dinas' => ['required', 'string', 'max:2000'],
            'dokumen' => ['nullable', 'array'],
            'dokumen.*.id_dokumen' => ['required', 'integer'],
            'dokumen.*.catatan_revisi' => ['required', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'catatan_koreksi_dinas.required' => 'Catatan koreksi dari dinas wajib diisi.',
            'dokumen.*.id_dokumen.required' => 'ID dokumen yang perlu direvisi wajib diisi.',
            'dokumen.*.catatan_revisi.required' => 'Catatan revisi untuk setiap dokumen wajib diisi.',
        ];
    }
}
