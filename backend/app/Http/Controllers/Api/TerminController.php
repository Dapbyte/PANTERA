<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadDokumenTerminRequest;
use App\Http\Requests\VerifikasiDokumenRequest;
use App\Models\DokumenTermin;
use App\Models\Proyek;
use App\Models\Termin;
use App\Services\TerminService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class TerminController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected TerminService $terminService
    ) {}

    /**
     * Daftar termin proyek beserta ringkasan checklist.
     */
    public function index(int $id_proyek): JsonResponse
    {
        $proyek = Proyek::find($id_proyek);

        if (! $proyek) {
            return $this->errorResponse('Proyek tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->terminService->listForProject($proyek),
            'Daftar termin berhasil dimuat.'
        );
    }

    /**
     * Checklist dokumen wajib satu termin (UC-10).
     */
    public function checklist(int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        return $this->successResponse(
            $this->terminService->checklist($termin),
            'Checklist dokumen termin berhasil dimuat.'
        );
    }

    /**
     * Unggah bukti termin (UC-10). Khusus Admin Lapangan.
     */
    public function uploadDokumen(UploadDokumenTerminRequest $request, int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        $dokumen = $this->terminService->uploadDokumen(
            $termin,
            $request->validated('jenis_dokumen'),
            $request->file('file_dokumen')
        );

        return $this->successResponse(
            ['dokumen' => $dokumen, 'checklist' => $this->terminService->checklist($termin)],
            'Dokumen termin berhasil diunggah.',
            201
        );
    }

    /**
     * Centang / cabut verifikasi dokumen termin (UC-10). Khusus Admin Lapangan.
     */
    public function verifikasiDokumen(VerifikasiDokumenRequest $request, int $id_termin, int $id_dokumen): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        $dokumen = DokumenTermin::where('id_termin', $termin->id_termin)->find($id_dokumen);

        if (! $dokumen) {
            return $this->errorResponse('Dokumen tidak ditemukan pada termin ini.', 404);
        }

        $dokumen = $this->terminService->verifikasiDokumen(
            $termin,
            $dokumen,
            $request->boolean('status_verifikasi'),
            $request->validated('catatan_revisi')
        );

        return $this->successResponse(
            ['dokumen' => $dokumen, 'checklist' => $this->terminService->checklist($termin)],
            'Status verifikasi dokumen berhasil diperbarui.'
        );
    }
}
