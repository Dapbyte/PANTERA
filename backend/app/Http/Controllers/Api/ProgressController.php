<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgresRequest;
use App\Models\Proyek;
use App\Services\ProgressService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ProgressController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProgressService $progressService
    ) {}

    // Cek pencarian, valid g?
    public function index(int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->progressService->listForProject($proyek),
            'Riwayat progres fisik berhasil dibuat'
        );

    }

    // input progres lapangan (kkhusus admin lapangan)
    public function store(StoreProgresRequest $request, int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        $hasil = $this->progressService->create(
            $proyek,
            (int) $request->user()->id_pengguna,
            $request->validated(),
            $request->file('foto')
        );

        return $this->successResponse($hasil, 'Laporan progres fisik berhasil disimpan.', 201);
    }
}
