<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResolveKendalaRequest;
use App\Http\Requests\StoreKendalaRequest;
use App\Models\KendalaLapangan;
use App\Models\Proyek;
use App\Services\KendalaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KendalaController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected KendalaService $kendalaService
    ) {}

    /**
     * Daftar kendala proyek (filter opsional ?status=Aktif|Resolved).
     */
    public function index(Request $request, int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->kendalaService->listForProject($proyek, $request->query('status')),
            'Daftar kendala lapangan berhasil dimuat.'
        );
    }

    /**
     * Melaporkan kendala lapangan (UC-09). Khusus Admin Lapangan.
     */
    public function store(StoreKendalaRequest $request, int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        $hasil = $this->kendalaService->create($proyek, $request->validated(), $request->file('foto'));

        return $this->successResponse($hasil, 'Kendala lapangan berhasil dilaporkan.', 201);
    }

    /**
     * Menandai kendala selesai / Resolved (UC-09 A1). Khusus Admin Lapangan.
     */
    public function resolve(ResolveKendalaRequest $request, int $id_kendala): JsonResponse
    {
        $kendala = KendalaLapangan::find($id_kendala);

        if (! $kendala) {
            return $this->errorResponse('Kendala tidak ditemukan.', 404);
        }

        $hasil = $this->kendalaService->resolve($kendala, $request->validated());

        return $this->successResponse($hasil, 'Kendala berhasil ditandai selesai.');
    }
}
