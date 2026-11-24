<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProyekRequest extends FormRequest
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
            'nama_proyek' => ['required', 'string', 'max:255'],
            'dinas_pemberi_kerja' => ['required', 'string', 'max:255'],
            'nilai_kontrak' => ['required', 'numeric', 'gt:0'],
            'tanggal_mulai' => ['required', 'date_format:Y-m-d'],
            'tanggal_selesai' => ['required', 'date_format:Y-m-d', 'after_or_equal:tanggal_mulai'],
            'status_proyek' => ['sometimes', 'in:Aktif,Selesai,Ditunda'],
            'total_pagu' => ['required', 'numeric', 'gte:0'],
            'admin_lapangan_ids' => ['sometimes', 'array'],
            'admin_lapangan_ids.*' => ['integer', 'exists:pengguna,id_pengguna'],
            'termin' => ['required', 'array', 'min:1'],
            'termin.*.id_termin' => ['nullable', 'integer'],
            'termin.*.nomor_termin' => ['required', 'integer', 'min:1'],
            'termin.*.target_persentase' => ['required', 'numeric', 'min:0', 'max:100'],
            'termin.*.nilai_tagihan' => ['required', 'numeric', 'gt:0'],
            'termin.*.tenggat_waktu' => ['required', 'date_format:Y-m-d'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama_proyek.required' => 'Nama proyek wajib diisi.',
            'dinas_pemberi_kerja.required' => 'Dinas pemberi kerja wajib diisi.',
            'nilai_kontrak.gt' => 'Nilai kontrak harus lebih besar dari 0.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'termin.min' => 'Jadwal termin minimal memiliki 1 tahapan.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $nilaiKontrak = (float) $this->input('nilai_kontrak');
            $tanggalMulai = $this->input('tanggal_mulai');
            $tanggalSelesai = $this->input('tanggal_selesai');
            $terminList = $this->input('termin', []);

            if (! is_array($terminList) || empty($terminList)) {
                return;
            }

            $totalTagihanTermin = 0.0;
            foreach ($terminList as $index => $termin) {
                $totalTagihanTermin += (float) ($termin['nilai_tagihan'] ?? 0);
                $tenggat = $termin['tenggat_waktu'] ?? null;

                if ($tenggat && $tanggalMulai && $tanggalSelesai) {
                    if ($tenggat < $tanggalMulai || $tenggat > $tanggalSelesai) {
                        $nomorTermin = $termin['nomor_termin'] ?? ($index + 1);
                        $validator->errors()->add(
                            "termin.{$index}.tenggat_waktu",
                            "Tenggat waktu termin ke-{$nomorTermin} ({$tenggat}) harus berada dalam rentang kontrak ({$tanggalMulai} s/d {$tanggalSelesai})."
                        );
                    }
                }
            }

            if (abs($totalTagihanTermin - $nilaiKontrak) > 0.01) {
                $validator->errors()->add(
                    'termin',
                    'Akumulasi nilai tagihan termin (Rp '.number_format($totalTagihanTermin, 2, ',', '.').') wajib sama persis dengan nilai kontrak (Rp '.number_format($nilaiKontrak, 2, ',', '.').').'
                );
            }
        });
    }
}
