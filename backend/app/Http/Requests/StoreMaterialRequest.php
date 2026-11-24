<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Admin Lapangan hanya menginput kebutuhan material & volume (TANPA harga).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'id_proyek' => ['required', 'integer', 'exists:proyek,id_proyek'],
            'sifat_pengajuan' => ['required', 'in:Rutin,Darurat'],
            'tanggal_butuh' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1990-01-01', 'before_or_equal:2100-12-31'],
            'catatan_lapangan' => ['nullable', 'string', 'max:1000'],
            'id_arsip_ref' => ['nullable', 'integer', 'exists:arsip_dokumen,id_arsip'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.nama_material' => ['required', 'string', 'max:255'],
            'items.*.volume' => ['required', 'numeric', 'gt:0'],
            'items.*.satuan' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_proyek.required' => 'Proyek wajib dipilih.',
            'id_proyek.exists' => 'Proyek tidak ditemukan.',
            'sifat_pengajuan.required' => 'Sifat pengajuan wajib dipilih.',
            'sifat_pengajuan.in' => 'Sifat pengajuan harus berupa Rutin atau Darurat.',
            'tanggal_butuh.date_format' => 'Format tanggal butuh harus YYYY-MM-DD.',
            'tanggal_butuh.after_or_equal' => 'Tanggal butuh minimal tahun 1990.',
            'items.required' => 'Minimal harus ada 1 item material.',
            'items.min' => 'Minimal harus ada 1 item material.',
            'items.*.nama_material.required' => 'Nama material wajib diisi.',
            'items.*.volume.required' => 'Volume material wajib diisi.',
            'items.*.volume.gt' => 'Volume material harus lebih besar dari 0.',
            'items.*.satuan.required' => 'Satuan material wajib dipilih.',
        ];
    }
}
