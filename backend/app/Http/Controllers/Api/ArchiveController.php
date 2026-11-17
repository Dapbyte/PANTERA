<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArsipRequest;
use App\Services\ArchiveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArchiveController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ArchiveService $archiveService
    ) {}

    /**
     * Pencarian multi-kriteria arsip (UC-02 & SD-07).
     */
    public function index(Request $request): JsonResponse
    {
        $archives = $this->archiveService->searchArchives($request->all());

        // Sesuai SD-07: Kembalikan 404 jika hasil pencarian kosong
        if ($archives->isEmpty()) {
            return $this->errorResponse('Arsip tidak ditemukan di repositori.', 404);
        }

        return $this->successResponse($archives, 'Daftar arsip berhasil dimuat.');
    }

    /**
     * Pencatatan lokasi arsip fisik / digital / hibrida (UC-11).
     */
    public function store(StoreArsipRequest $request): JsonResponse
    {
        $file = $request->file('file_dokumen');
        $pencatatId = (int) $request->user()->id_pengguna;

        $result = $this->archiveService->createArchive(
            $request->validated(),
            $pencatatId,
            $file
        );

        return $this->successResponse(
            $result,
            'Arsip berhasil dicatat ke repositori.',
            201
        );
    }

    /**
     * Menampilkan detail lengkap arsip beserta URL digital dan koordinat fisik.
     */
    public function show(int $id_arsip): JsonResponse
    {
        $arsip = $this->archiveService->getArchiveDetail($id_arsip);

        if (! $arsip) {
            return $this->errorResponse('Arsip tidak ditemukan.', 404);
        }

        $previewUrl = $arsip->path_digital
            ? Storage::disk('public')->url($arsip->path_digital)
            : null;

        $data = $arsip->toArray();
        $data['preview_url'] = $previewUrl;

        return $this->successResponse($data, 'Detail arsip berhasil dimuat.');
    }

    /**
     * Menghapus arsip dokumen dari repositori.
     */
    public function destroy(int $id_arsip): JsonResponse
    {
        $deleted = $this->archiveService->deleteArchive($id_arsip);

        if (! $deleted) {
            return $this->errorResponse('Arsip tidak ditemukan.', 404);
        }

        return $this->successResponse(null, 'Dokumen arsip berhasil dihapus.');
    }
}
