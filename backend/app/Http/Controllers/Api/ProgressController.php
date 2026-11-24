<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgresRequest;
use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Models\User;
use App\Services\ProgressService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProgressService $progressService
    ) {}

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
            $this->progressService->listForProject($proyek),
            'Riwayat progres fisik berhasil dibuat'
        );
    }

    public function store(StoreProgresRequest $request, int $id_proyek): JsonResponse
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

        $hasil = $this->progressService->create(
            $proyek,
            (int) $user->id_pengguna,
            $request->validated(),
            $request->file('foto'),
            $fotosArray
        );

        return $this->successResponse($hasil, 'Laporan progres fisik berhasil disimpan.', 201);
    }

    /**
     * Memperbarui status verifikasi pengawas untuk satu laporan progres fisik.
     */
    public function verifikasi(Request $request, int $id_progres): JsonResponse
    {
        $progres = ProgresFisik::find($id_progres);

        if (! $progres) {
            return $this->errorResponse('Laporan progres tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $progres->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        $validated = $request->validate([
            'verifikasi_pengawas' => ['required', 'boolean'],
        ]);

        $updated = $this->progressService->verifikasiPengawas(
            $progres,
            (bool) $validated['verifikasi_pengawas']
        );

        return $this->successResponse($updated, 'Status verifikasi pengawas berhasil diperbarui.');
    }
}
