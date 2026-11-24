<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResolveKendalaRequest;
use App\Http\Requests\StoreKendalaRequest;
use App\Models\KendalaLapangan;
use App\Models\Proyek;
use App\Models\User;
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

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek($id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        return $this->successResponse(
            $this->kendalaService->listForProject($proyek, $request->query('status')),
            'Daftar kendala lapangan berhasil dimuat.'
        );
    }

    /**
     * Melaporkan kendala lapangan. Khusus Admin Lapangan pada proyek yang ditugaskan.
     */
    public function store(StoreKendalaRequest $request, int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek($id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        $fotos = $request->file('fotos', []);
        $fotosArray = is_array($fotos) ? $fotos : [];

        $hasil = $this->kendalaService->create(
            $proyek,
            $request->validated(),
            $request->file('foto'),
            $fotosArray
        );

        return $this->successResponse($hasil, 'Kendala lapangan berhasil dilaporkan.', 201);
    }

    /**
     * Menandai kendala selesai / Resolved. Khusus Admin Lapangan pada proyek yang ditugaskan.
     */
    public function resolve(ResolveKendalaRequest $request, int $id_kendala): JsonResponse
    {
        $kendala = KendalaLapangan::with('progresFisik')->find($id_kendala);

        if (! $kendala) {
            return $this->errorResponse('Kendala tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        $progres = $kendala->progresFisik;
        $idProyek = $progres ? (int) $progres->id_proyek : 0;
        if ($idProyek > 0 && ! $user->canAccessProyek($idProyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        $hasil = $this->kendalaService->resolve($kendala, $request->validated());

        return $this->successResponse($hasil, 'Kendala berhasil ditandai selesai.');
    }
}
