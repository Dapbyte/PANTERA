<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CairkanTerminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi pencatatan pencairan SP2D (UC-06).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nomor_sp2d' => ['required', 'string', 'max:255', 'unique:termin,nomor_sp2d'],
            'tanggal_cair' => ['required', 'date', 'before_or_equal:today'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nomor_sp2d.required' => 'Nomor SP2D wajib diisi.',
            'nomor_sp2d.unique' => 'Nomor SP2D sudah tercatat pada termin lain.',
            'tanggal_cair.required' => 'Tanggal pencairan wajib diisi.',
            'tanggal_cair.before_or_equal' => 'Tanggal pencairan tidak boleh di masa depan.',
        ];
    }
}
