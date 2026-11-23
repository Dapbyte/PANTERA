<?php

namespace App\Services;

use App\Models\RequestMaterial;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MaterialService
{
    public function create(array $data, int $idPengaju): RequestMaterial
    {
        return DB::transaction(function () use ($data, $idPengaju) {
            // Buat pengajuan utama
            $request = RequestMaterial::create([
                'no_request' => 'REQ-' . Str::uuid(),
                'id_proyek' => $data['id_proyek'],
                'id_pengaju' => $idPengaju,
                'tanggal_pengajuan' => now(),
                'sifat_pengajuan' => $data['sifat_pengajuan'],
                'status_approval' => 'Pending',
                'total_estimasi' => 0,
            ]);

            $total = 0;

            // Simpan semua item material
            foreach ($data['items'] as $item) {
                $subtotal = $item['volume'] * $item['estimasi_harga'];
                $total += $subtotal;

                $request->itemMaterial()->create($item);
            }

            // Simpan total estimasi
            $request->update([
                'total_estimasi' => $total,
            ]);

            return $request->load('itemMaterial');
        });
    }

    public function validateFinance(RequestMaterial $request, int $idValidator): RequestMaterial
    {
        // Hanya pengajuan Pending yang boleh divalidasi
        if ($request->status_approval !== 'Pending') {
            throw new \InvalidArgumentException('Pengajuan tidak berstatus Pending.');
        }

        // Simpan hasil validasi Keuangan
        $request->update([
            'id_validator' => $idValidator,
            'status_approval' => 'TervalidasiKeuangan',
        ]);

        return $request;
    }

    public function approve(
        RequestMaterial $request,
        int $idDirektur,
        string $keputusan,
        ?string $catatan = null
    ): RequestMaterial {
        // Direktur hanya memproses pengajuan yang sudah divalidasi Keuangan
        if ($request->status_approval !== 'TervalidasiKeuangan') {
            throw new \InvalidArgumentException('Pengajuan belum divalidasi Keuangan.');
        }

        // Keputusan hanya boleh Disetujui atau Revisi
        if (! in_array($keputusan, ['Disetujui', 'Revisi'], true)) {
            throw new \InvalidArgumentException('Keputusan tidak valid.');
        }

        // Simpan keputusan Direktur
        $request->update([
            'id_direktur' => $idDirektur,
            'status_approval' => $keputusan,
            'catatan_direktur' => $catatan,
        ]);

        return $request;
    }
}
