<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKendalaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // Aturan validasi pelaporan kendala lapangan (UC-09).
    public function rules(): array
    {
        return [
            'id_progres' => ['nullable', 'integer', 'exists:progres_fisik,id_progres'],
            'tanggal_kejadian' => ['nullable', 'date', 'before_or_equal:today'],
            'kategori_kendala' => ['required', Rule::in(config('pantera.kendala.kategori'))],
            'tingkat_keparahan' => ['required', Rule::in(array_keys(config('pantera.kendala.keparahan')))],
            'deskripsi_kendala' => ['required', 'string', 'max:2000'],
            'estimasi_hari_tertunda' => ['required', 'integer', 'min:0', 'max:365'],
            'foto' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
            'fotos' => ['nullable', 'array', 'max:10'],
            'fotos.*' => ['file', 'mimes:jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_progres.exists' => 'Laporan progres tidak ditemukan.',
            'tanggal_kejadian.before_or_equal' => 'Tanggal kejadian tidak boleh di masa depan.',
            'kategori_kendala.required' => 'Kategori kendala wajib dipilih.',
            'kategori_kendala.in' => 'Kategori kendala harus salah satu dari: Cuaca, Material, Tenaga Kerja, Peralatan, Teknis.',
            'tingkat_keparahan.required' => 'Tingkat keparahan wajib dipilih.',
            'tingkat_keparahan.in' => 'Tingkat keparahan harus Ringan, Sedang, atau Berat.',
            'deskripsi_kendala.required' => 'Deskripsi kendala wajib diisi.',
            'estimasi_hari_tertunda.required' => 'Estimasi hari terhenti wajib diisi.',
            'estimasi_hari_tertunda.integer' => 'Estimasi hari terhenti harus berupa bilangan bulat.',
            'foto.mimes' => 'Format foto harus berupa JPG, JPEG, atau PNG.',
            'foto.max' => 'Ukuran foto maksimal 10 MB.',
            'fotos.max' => 'Maksimal 10 foto yang dapat diunggah sekaligus.',
            'fotos.*.mimes' => 'Semua foto harus berformat JPG, JPEG, atau PNG.',
            'fotos.*.max' => 'Ukuran setiap foto maksimal 10 MB.',
        ];
    }
}
