<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProyekRequest;
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
     * Katalog daftar proyek dengan filter pencarian dan ringkasan operasional.
     */
    public function index(Request $request): JsonResponse
    {
        $keyword = $request->query('q');
        $statusProyek = $request->query('status_proyek');

        $projects = $this->projectService->getProjectList($keyword, $statusProyek);

        return $this->successResponse($projects, 'Katalog daftar proyek berhasil dimuat.');
    }

    /**
     * Detail lengkap proyek, RAB, termin, dan rekap progres.
     */
    public function show(int $id_proyek): JsonResponse
    {
        $detail = $this->projectService->getProjectDetail($id_proyek);

        if (! $detail) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

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
}
