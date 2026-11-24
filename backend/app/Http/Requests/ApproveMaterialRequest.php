<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $keputusan = (string) $this->input('keputusan', '');
        if ($keputusan === 'Perlu Revisi') {
            $keputusan = 'Revisi';
        } elseif ($keputusan === 'Selesai') {
            $keputusan = 'Disetujui';
        }

        $alasan = $this->input('alasan_penolakan');
        if (($alasan === null || trim((string) $alasan) === '') && $this->filled('catatan_direktur')) {
            $alasan = $this->input('catatan_direktur');
        }

        $this->merge([
            'keputusan' => $keputusan,
            'alasan_penolakan' => $alasan,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'keputusan' => ['required', 'in:Disetujui,Revisi'],
            'catatan_direktur' => ['nullable', 'string', 'max:1000'],
            'alasan_penolakan' => ['required_if:keputusan,Revisi', 'nullable', 'string', 'max:1000'],
            'id_arsip_ref' => ['nullable', 'integer', 'exists:arsip_dokumen,id_arsip'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'keputusan.required' => 'Keputusan persetujuan wajib dipilih.',
            'keputusan.in' => 'Keputusan harus Disetujui atau Revisi.',
            'alasan_penolakan.required_if' => 'Alasan penolakan/revisi wajib diisi oleh Direktur.',
            'id_arsip_ref.exists' => 'Referensi arsip tidak ditemukan.',
        ];
    }
}
