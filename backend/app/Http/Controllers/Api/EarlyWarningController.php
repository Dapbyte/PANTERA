<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use App\Models\User;
use App\Services\EarlyWarningService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarlyWarningController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EarlyWarningService $earlyWarningService
    ) {}

    public function show(Request $request, int $id_proyek): JsonResponse
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
            $this->earlyWarningService->analyze($proyek),
            'Early warning termin berhasil dimuat.'
        );
    }

    public function index(): JsonResponse
    {
        return $this->successResponse(
            $this->earlyWarningService->portfolio(),
            'Portofolio early warning berhasil dimuat.'
        );
    }
}
