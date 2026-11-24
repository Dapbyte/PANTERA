<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArsipRequest;
use App\Models\User;
use App\Services\ArchiveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ArchiveController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ArchiveService $archiveService
    ) {}

    /**
     * Pencarian multi-kriteria arsip dengan pagination & pengurutan (selalu 200 OK walau hasil kosong).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $this->archiveService->searchArchives(
            $request->all(),
            $user->allowedProyekIds()
        );

        return $this->successResponse($result, 'Daftar arsip berhasil dimuat.');
    }

    /**
     * Pencatatan lokasi arsip fisik / digital / hibrida.
     */
    public function store(StoreArsipRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $idProyek = (int) $request->validated('id_proyek');

        if (! $user->canAccessProyek($idProyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        $file = $request->file('file_dokumen');
        $pencatatId = (int) $user->id_pengguna;

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
     * Menampilkan detail lengkap arsip beserta URL pratinjau/unduh digital dan koordinat fisik.
     */
    public function show(Request $request, int $id_arsip): JsonResponse
    {
        $arsip = $this->archiveService->getArchiveDetail($id_arsip);

        if (! $arsip) {
            return $this->errorResponse('Arsip tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $arsip->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke arsip proyek ini.', 403);
        }

        $previewUrl = $arsip->path_digital
            ? Storage::disk('public')->url($arsip->path_digital)
            : null;

        $data = $arsip->toArray();
        $data['preview_url'] = $previewUrl;
        $data['file_api_url'] = $arsip->path_digital ? "/api/archive/{$id_arsip}/file" : null;

        return $this->successResponse($data, 'Detail arsip berhasil dimuat.');
    }

    /**
     * Menyajikan file digital arsip untuk preview inline di website & unduhan (ARS-12, ARS-13).
     */
    public function file(Request $request, int $id_arsip): BinaryFileResponse|JsonResponse
    {
        $arsip = $this->archiveService->getArchiveDetail($id_arsip);

        if (! $arsip) {
            return $this->errorResponse('Arsip tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $arsip->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke arsip proyek ini.', 403);
        }

        if (! $arsip->path_digital || ! Storage::disk('public')->exists($arsip->path_digital)) {
            return $this->errorResponse('Berkas digital arsip tidak ditemukan.', 404);
        }

        $absolutePath = Storage::disk('public')->path($arsip->path_digital);
        $ext = pathinfo($absolutePath, PATHINFO_EXTENSION);
        $safeBase = preg_replace('/[^A-Za-z0-9\-_. ]/', '_', (string) $arsip->kode_arsip);
        $filename = trim((string) $safeBase) !== '' ? "{$safeBase}".($ext ? ".{$ext}" : '') : basename($absolutePath);

        if ($request->boolean('download')) {
            return response()->download($absolutePath, $filename);
        }

        return response()->file($absolutePath, [
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Memperbarui koordinat lokasi fisik atau metadata arsip.
     */
    public function update(Request $request, int $id_arsip): JsonResponse
    {
        $existing = $this->archiveService->getArchiveDetail($id_arsip);
        if (! $existing) {
            return $this->errorResponse('Arsip tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $existing->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke arsip proyek ini.', 403);
        }

        $validated = $request->validate([
            'nomor_surat' => ['sometimes', 'required', 'string', 'max:255'],
            'jenis_transaksi' => ['sometimes', 'required', 'string', 'max:255'],
            'pihak_penyedia' => ['sometimes', 'required', 'string', 'max:255'],
            'judul_dokumen' => ['sometimes', 'required', 'string', 'max:255'],
            'jenis_arsip' => ['sometimes', 'required', 'string', 'max:255'],
            'tanggal_arsip' => ['sometimes', 'required', 'date_format:Y-m-d', 'after_or_equal:1990-01-01', 'before_or_equal:2100-12-31'],
            'tipe_penyimpanan' => ['sometimes', 'required', 'in:Fisik,Digital,Hibrida'],
            'nomor_binder' => ['sometimes', 'nullable', 'string', 'max:255'],
            'nomor_rak' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ruang_simpan' => ['sometimes', 'nullable', 'string', 'max:255'],
            'keterangan_posisi' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $this->archiveService->updateArchiveLocation($id_arsip, $validated);

        return $this->successResponse($result, 'Data dan lokasi arsip berhasil diperbarui.');
    }

    /**
     * Menghapus arsip dokumen dari repositori (khusus Direktur melalui otorisasi route/controller).
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
