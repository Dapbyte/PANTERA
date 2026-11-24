<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProgresRequest extends FormRequest
{
    // Otoisasi oleh middleware admin lapangan
    public function authorize(): bool
    {
        return true;
    }

    // Aturan validasi input progres
    public function rules(): array
    {
        return [
            'tanggal_lapor' => ['nullable', 'date', 'before_or_equal:today'],
            'persentase_realisasi' => ['required', 'numeric', 'between:0,100'],
            'deskripsi_pekerjaan' => ['required', 'string', 'max:2000'],
            'foto' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
            'fotos' => ['nullable', 'array', 'max:10'],
            'fotos.*' => ['file', 'mimes:jpg,jpeg,png', 'max:10240'],
        ];
    }

    // Pesan eror
    public function messages(): array
    {
        return [
            'tanggal_lapor.before_or_equal' => 'Tanggal laporan tidak boleh di masa depan.',
            'persentase_realisasi.required' => 'Persentase capaian kumulatif wajib diisi.',
            'persentase_realisasi.numeric' => 'Persentase capaian harus berupa angka.',
            'persentase_realisasi.between' => 'Persentase capaian harus antara 0 sampai 100.',
            'deskripsi_pekerjaan.required' => 'Deskripsi pekerjaan wajib diisi.',
            'foto.mimes' => 'Format foto harus berupa JPG, JPEG, atau PNG.',
            'foto.max' => 'Ukuran foto maksimal 10 MB.',
            'fotos.max' => 'Maksimal 10 foto yang dapat diunggah sekaligus.',
            'fotos.*.mimes' => 'Semua foto harus berformat JPG, JPEG, atau PNG.',
            'fotos.*.max' => 'Ukuran setiap foto maksimal 10 MB.',
        ];
    }
}
