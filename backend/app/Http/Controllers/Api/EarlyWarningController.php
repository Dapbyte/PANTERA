<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use App\Services\EarlyWarningService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class EarlyWarningController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EarlyWarningService $earlyWarningService
    ) {}

    public function show(int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
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
