<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProyekRequest extends FormRequest
{
    /**
     * Otorisasi request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi request pembuatan proyek.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kode_proyek' => ['nullable', 'string', 'max:50', 'unique:proyek,kode_proyek'],
            'nama_proyek' => ['required', 'string', 'max:255'],
            'dinas_pemberi_kerja' => ['required', 'string', 'max:255'],
            'nilai_kontrak' => ['required', 'numeric', 'gt:0'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'total_pagu' => ['required', 'numeric', 'gte:0'],
            'termin' => ['required', 'array', 'min:1'],
            'termin.*.nomor_termin' => ['required', 'integer', 'min:1'],
            'termin.*.target_persentase' => ['required', 'numeric', 'min:0', 'max:100'],
            'termin.*.nilai_tagihan' => ['required', 'numeric', 'gt:0'],
            'termin.*.tenggat_waktu' => ['required', 'date'],
        ];
    }

    /**
     * Pesan validasi kustom.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kode_proyek.unique' => 'Kode proyek sudah digunakan.',
            'nama_proyek.required' => 'Nama proyek wajib diisi.',
            'dinas_pemberi_kerja.required' => 'Dinas pemberi kerja wajib diisi.',
            'nilai_kontrak.required' => 'Nilai kontrak wajib diisi.',
            'nilai_kontrak.gt' => 'Nilai kontrak harus lebih besar dari 0.',
            'tanggal_mulai.required' => 'Tanggal mulai kontrak wajib diisi.',
            'tanggal_selesai.required' => 'Tanggal selesai kontrak wajib diisi.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'total_pagu.required' => 'Total pagu RAB wajib diisi.',
            'termin.required' => 'Jadwal termin wajib diisi.',
            'termin.min' => 'Jadwal termin minimal memiliki 1 tahapan.',
        ];
    }

    /**
     * Validasi bisnis kritis (validasiJadwalTermin sesuai Tabel 2.12 & SD-08).
     */
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

            // Validasi akumulasi nilai tagihan termin wajib sama persis dengan nilai kontrak
            if (abs($totalTagihanTermin - $nilaiKontrak) > 0.01) {
                $validator->errors()->add(
                    'termin',
                    'Akumulasi nilai tagihan termin (Rp '.number_format($totalTagihanTermin, 2, ',', '.').') wajib sama persis dengan nilai kontrak (Rp '.number_format($nilaiKontrak, 2, ',', '.').').'
                );
            }
        });
    }
}
