<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidateMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $keputusan = (string) $this->input('keputusan', 'Setuju');
        if (in_array($keputusan, ['TervalidasiKeuangan', 'Menunggu Direktur', 'Setuju', ''], true)) {
            $keputusan = 'Setuju';
        } elseif ($keputusan === 'Perlu Revisi') {
            $keputusan = 'Revisi';
        }

        $alasan = $this->input('alasan_penolakan');
        if (($alasan === null || trim((string) $alasan) === '') && $this->filled('catatan_keuangan')) {
            $alasan = $this->input('catatan_keuangan');
        }

        $rawItems = $this->input('items');
        $normalizedItems = null;
        if (is_array($rawItems)) {
            $normalizedItems = array_map(function ($it) {
                if (! is_array($it)) {
                    return $it;
                }
                if (! array_key_exists('harga_satuan', $it) && array_key_exists('estimasi_harga', $it)) {
                    $it['harga_satuan'] = $it['estimasi_harga'];
                }

                return $it;
            }, $rawItems);
        }

        $this->merge([
            'keputusan' => $keputusan,
            'alasan_penolakan' => $alasan,
            'items' => $normalizedItems,
        ]);
    }

    /**
     * Keuangan mengisi vendor (tersedia / pengganti) & harga satuan per item, atau menolak dengan alasan.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'keputusan' => ['required', 'in:Setuju,Revisi'],
            'skema_pembayaran' => ['required_if:keputusan,Setuju', 'nullable', 'in:Kas,Kredit'],
            'catatan_keuangan' => ['nullable', 'string', 'max:1000'],
            'alasan_penolakan' => ['required_if:keputusan,Revisi', 'nullable', 'string', 'max:1000'],

            'items' => ['required_if:keputusan,Setuju', 'nullable', 'array', 'min:1'],
            'items.*.id_item' => ['required_with:items', 'integer'],
            'items.*.ketersediaan_vendor' => ['required_with:items', 'boolean'],
            'items.*.vendor_nama' => ['required_if:items.*.ketersediaan_vendor,true,1', 'nullable', 'string', 'max:255'],
            'items.*.vendor_pengganti' => ['required_if:items.*.ketersediaan_vendor,false,0', 'nullable', 'string', 'max:255'],
            'items.*.harga_satuan' => ['required_if:keputusan,Setuju', 'nullable', 'numeric', 'gt:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'keputusan.in' => 'Keputusan harus Setuju atau Revisi.',
            'skema_pembayaran.required_if' => 'Skema pembayaran (Kas atau Kredit) wajib dipilih.',
            'skema_pembayaran.in' => 'Skema pembayaran harus Kas atau Kredit.',
            'alasan_penolakan.required_if' => 'Alasan penolakan/revisi wajib diisi.',
            'items.required_if' => 'Daftar harga dan vendor per item wajib diisi saat menyetujui pengajuan.',
            'items.*.vendor_nama.required_if' => 'Nama vendor wajib diisi jika vendor tersedia.',
            'items.*.vendor_pengganti.required_if' => 'Nama vendor pengganti wajib diisi jika vendor utama tidak tersedia.',
            'items.*.harga_satuan.required_if' => 'Harga satuan material wajib diisi.',
            'items.*.harga_satuan.gt' => 'Harga satuan material harus lebih besar dari 0.',
        ];
    }
}
