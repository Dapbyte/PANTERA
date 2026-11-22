<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AjukanTerminRequest;
use App\Http\Requests\CairkanTerminRequest;
use App\Http\Requests\KoreksiTerminRequest;
use App\Models\Termin;
use App\Services\BillingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BillingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BillingService $billingService
    ) {}

    /**
     * Mengajukan tagihan termin ke dinas (UC-06). Khusus Sekretaris/Keuangan.
     */
    public function ajukan(AjukanTerminRequest $request, int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->billingService->ajukan($termin, $request->validated()),
            'Tagihan termin berhasil diajukan ke dinas.'
        );
    }

    /**
     * Mencatat koreksi administratif dari dinas (UC-06 A1).
     */
    public function koreksi(KoreksiTerminRequest $request, int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->billingService->koreksi($termin, $request->validated()),
            'Koreksi dinas berhasil dicatat.'
        );
    }

    /**
     * Mencatat pencairan SP2D (UC-06).
     */
    public function sp2d(CairkanTerminRequest $request, int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->billingService->cairkan($termin, $request->validated()),
            'Pencairan SP2D berhasil dicatat.'
        );
    }
}
