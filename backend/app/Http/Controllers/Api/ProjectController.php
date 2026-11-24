<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProyekRequest;
use App\Http\Requests\UpdateProyekRequest;
use App\Models\Proyek;
use App\Models\User;
use App\Services\ProjectService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProjectService $projectService
    ) {}

    /**
     * Katalog daftar proyek dengan filter pencarian, batasan akses Admin Lapangan, dan ringkasan operasional.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $keyword = $request->query('q');
        $statusProyek = $request->query('status_proyek');

        $projects = $this->projectService->getProjectList(
            $keyword,
            $statusProyek,
            $user->allowedProyekIds()
        );

        return $this->successResponse($projects, 'Katalog daftar proyek berhasil dimuat.');
    }

    /**
     * Detail lengkap proyek, RAB, termin, dan rekap progres.
     */
    public function show(Request $request, int $id_proyek): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $exists = Proyek::where('id_proyek', $id_proyek)->exists();

        if (! $exists) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        if (! $user->canAccessProyek($id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        $detail = $this->projectService->getProjectDetail($id_proyek, $user->isAdminLapangan());

        return $this->successResponse($detail, 'Detail proyek berhasil dimuat.');
    }

    /**
     * Pembuatan proyek baru beserta RAB dan tahapan Termin (UC-12 & SD-08).
     * Khusus peran Direktur.
     */
    public function store(StoreProyekRequest $request): JsonResponse
    {
        $pembuatId = (int) $request->user()->id_pengguna;

        $proyek = $this->projectService->createProject(
            $request->validated(),
            $pembuatId
        );

        return $this->successResponse(
            $proyek,
            'Proyek dan RAB berhasil dibuat.',
            201
        );
    }

    /**
     * Memperbarui proyek, RAB, jadwal termin, dan akses Admin Lapangan (DIR-03).
     * Khusus peran Direktur.
     */
    public function update(UpdateProyekRequest $request, int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        $updated = $this->projectService->updateProject($proyek, $request->validated());

        return $this->successResponse($updated, 'Data proyek dan RAB berhasil diperbarui.');
    }

    /**
     * Menghapus proyek beserta data turunannya (DIR-03). Khusus peran Direktur.
     */
    public function destroy(int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        $this->projectService->deleteProject($proyek);

        return $this->successResponse(null, 'Proyek berhasil dihapus.');
    }
}
