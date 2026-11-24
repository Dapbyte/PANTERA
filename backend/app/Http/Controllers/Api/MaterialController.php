<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaterialRequest;
use App\Models\RequestMaterial;
use App\Services\MaterialService;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function store(StoreMaterialRequest $request, MaterialService $service)
    {
        // Kirim pengajuan material ke service
        $material = $service->create(
            $request->validated(),
            $request->user()->id_pengguna
        );

        return response()->json([
            'message' => 'Pengajuan material berhasil dibuat',
            'data' => $material,
        ], 201);
    }

    public function validateFinance(Request $request, MaterialService $service, int $id_request)
    {
        // Cari pengajuan berdasarkan ID
        $material = RequestMaterial::findOrFail($id_request);

        // Hanya pengajuan Pending yang bisa divalidasi
        if ($material->status_approval !== 'Pending') {
            return response()->json([
                'message' => 'Pengajuan tidak berstatus Pending.',
            ], 422);
        }

        // Validasi pengajuan oleh Keuangan
        $material = $service->validateFinance(
            $material,
            $request->user()->id_pengguna
        );

        return response()->json([
            'message' => 'Pengajuan material berhasil divalidasi',
            'data' => $material,
        ]);
    }

    public function approve(Request $request, MaterialService $service, int $id_request)
    {
        // Periksa keputusan dan catatan Direktur
        $data = $request->validate([
            'keputusan' => ['required', 'in:Disetujui,Revisi'],
            'catatan_direktur' => ['required_if:keputusan,Revisi', 'nullable', 'string'],
        ]);

        // Cari pengajuan berdasarkan ID
        $material = RequestMaterial::findOrFail($id_request);

        if ($material->status_approval !== 'TervalidasiKeuangan') {
            return response()->json([
                'message' => 'Pengajuan belum divalidasi Keuangan.',
            ], 422);
        }

        // Simpan keputusan Direktur
        $material = $service->approve(
            $material,
            $request->user()->id_pengguna,
            $data['keputusan'],
            $data['catatan_direktur'] ?? null
        );

        return response()->json([
            'message' => 'Keputusan Direktur berhasil disimpan',
            'data' => $material,
        ]);
    }
}
