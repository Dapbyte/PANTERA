<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBankCreditRequest;
use App\Http\Requests\UpdateBankCreditRequest;
use App\Models\FasilitasKredit;
use App\Models\Proyek;
use App\Services\BankCreditService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankCreditController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BankCreditService $bankCreditService
    ) {}

    /**
     * Daftar riwayat koordinasi fasilitas kredit perbankan (UC-05).
     */
    public function index(Request $request): JsonResponse
    {
        $items = $this->bankCreditService->list($request->only([
            'id_proyek',
            'status_koordinasi',
            'q',
        ]));

        return $this->successResponse($items, 'Daftar koordinasi fasilitas kredit berhasil dimuat.');
    }

    /**
     * Mencatat pengajuan atau hasil koordinasi kredit bank (UC-05). Khusus Sekretaris/Keuangan.
     */
    public function store(StoreBankCreditRequest $request): JsonResponse
    {
        $kredit = $this->bankCreditService->create(
            $request->validated(),
            (int) $request->user()->id_pengguna
        );

        return $this->successResponse($kredit, 'Data koordinasi kredit bank berhasil disimpan.', 201);
    }

    /**
     * Memperbarui status/kesepakatan tenor & plafon kredit bank (UC-05). Khusus Sekretaris/Keuangan.
     */
    public function update(UpdateBankCreditRequest $request, int $id_kredit): JsonResponse
    {
        $kredit = FasilitasKredit::find($id_kredit);

        if (! $kredit) {
            return $this->errorResponse('Data fasilitas kredit tidak ditemukan.', 404);
        }

        $updated = $this->bankCreditService->update($kredit, $request->validated());

        return $this->successResponse($updated, 'Data fasilitas kredit berhasil diperbarui.');
    }

    /**
     * Mengekspor ringkasan laporan performa proyek resmi untuk diserahkan ke bank (UC-05).
     */
    public function performanceReport(int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        $report = $this->bankCreditService->generatePerformanceReport($proyek);

        return $this->successResponse($report, 'Laporan performa proyek untuk bank berhasil dibuat.');
    }
}
