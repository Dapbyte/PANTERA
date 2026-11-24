<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreArsipRequest extends FormRequest
{
    /**
     * Otorisasi request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi input arsip dokumen (UC-11).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_proyek' => ['required', 'integer', 'exists:proyek,id_proyek'],
            'nomor_surat' => ['required', 'string', 'max:255'],
            'jenis_transaksi' => ['required', 'string', 'max:255'],
            'pihak_penyedia' => ['required', 'string', 'max:255'],
            'kode_arsip' => ['nullable', 'string', 'max:100', 'unique:arsip_dokumen,kode_arsip'],
            'judul_dokumen' => ['required', 'string', 'max:255'],
            'jenis_arsip' => ['required', 'string', 'max:255'],
            'tanggal_arsip' => ['required', 'date_format:Y-m-d', 'after_or_equal:1990-01-01', 'before_or_equal:2100-12-31'],
            'tipe_penyimpanan' => ['required', 'in:Fisik,Digital,Hibrida'],

            // File digital wajib untuk tipe Digital Murni dan Hibrida (ARS-10)
            'file_dokumen' => ['required_if:tipe_penyimpanan,Digital,Hibrida', 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],

            // Koordinat fisik (wajib jika Fisik atau Hibrida)
            'nomor_binder' => ['required_if:tipe_penyimpanan,Fisik,Hibrida', 'nullable', 'string', 'max:255'],
            'nomor_rak' => ['required_if:tipe_penyimpanan,Fisik,Hibrida', 'nullable', 'string', 'max:255'],
            'ruang_simpan' => ['required_if:tipe_penyimpanan,Fisik,Hibrida', 'nullable', 'string', 'max:255'],
            'keterangan_posisi' => ['nullable', 'string', 'max:255'],

            // Referensi silang transaksi material opsional
            'id_request' => ['nullable', 'integer', 'exists:request_material,id_request'],
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
            'id_proyek.required' => 'Proyek wajib dipilih.',
            'id_proyek.exists' => 'Proyek tidak ditemukan.',
            'nomor_surat.required' => 'Nomor surat wajib diisi.',
            'jenis_transaksi.required' => 'Jenis transaksi wajib diisi.',
            'pihak_penyedia.required' => 'Pihak penyedia wajib diisi.',
            'kode_arsip.unique' => 'Kode arsip sudah terdaftar.',
            'judul_dokumen.required' => 'Judul dokumen wajib diisi.',
            'jenis_arsip.required' => 'Jenis arsip wajib diisi.',
            'tanggal_arsip.required' => 'Tanggal arsip wajib diisi.',
            'tanggal_arsip.date_format' => 'Format tanggal arsip harus YYYY-MM-DD.',
            'tanggal_arsip.after_or_equal' => 'Tanggal arsip minimal tahun 1990.',
            'tanggal_arsip.before_or_equal' => 'Tanggal arsip maksimal tahun 2100.',
            'tipe_penyimpanan.required' => 'Tipe penyimpanan wajib dipilih (Fisik, Digital, Hibrida).',
            'tipe_penyimpanan.in' => 'Tipe penyimpanan harus berupa Fisik, Digital, atau Hibrida.',
            'nomor_binder.required_if' => 'Nomor binder wajib diisi untuk arsip Fisik atau Hibrida.',
            'nomor_rak.required_if' => 'Nomor rak wajib diisi untuk arsip Fisik atau Hibrida.',
            'ruang_simpan.required_if' => 'Ruang simpan wajib diisi untuk arsip Fisik atau Hibrida.',
            'file_dokumen.required_if' => 'Berkas digital wajib diunggah untuk arsip bertipe Digital atau Hibrida.',
            'file_dokumen.mimes' => 'Format file dokumen harus berupa PDF, JPG, JPEG, atau PNG.',
            'file_dokumen.max' => 'Ukuran file dokumen maksimal 10 MB.',
        ];
    }
}
