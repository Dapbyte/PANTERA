<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadDokumenTerminRequest;
use App\Http\Requests\VerifikasiDokumenRequest;
use App\Models\DokumenTermin;
use App\Models\Proyek;
use App\Models\Termin;
use App\Models\User;
use App\Services\TerminService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TerminController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected TerminService $terminService
    ) {}

    /**
     * Daftar termin proyek beserta ringkasan checklist.
     */
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
            $this->terminService->listForProject($proyek),
            'Daftar termin berhasil dimuat.'
        );
    }

    /**
     * Checklist dokumen wajib satu termin.
     */
    public function checklist(Request $request, int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $termin->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        return $this->successResponse(
            $this->terminService->checklist($termin),
            'Checklist dokumen termin berhasil dimuat.'
        );
    }

    /**
     * Unggah bukti termin. Khusus Admin Lapangan.
     */
    public function uploadDokumen(UploadDokumenTerminRequest $request, int $id_termin): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $termin->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
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
     * Centang / cabut verifikasi dokumen termin. Khusus Sekretaris/Keuangan.
     */
    public function verifikasiDokumen(VerifikasiDokumenRequest $request, int $id_termin, int $id_dokumen): JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $termin->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
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

    /**
     * Menyajikan berkas dokumen termin terautentikasi untuk preview inline & unduhan.
     */
    public function fileDokumen(Request $request, int $id_termin, int $id_dokumen): BinaryFileResponse|JsonResponse
    {
        $termin = Termin::find($id_termin);

        if (! $termin) {
            return $this->errorResponse('Termin tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $termin->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke dokumen termin proyek ini.', 403);
        }

        $dokumen = DokumenTermin::where('id_termin', $termin->id_termin)->find($id_dokumen);

        if (! $dokumen) {
            return $this->errorResponse('Dokumen tidak ditemukan pada termin ini.', 404);
        }

        if (! $dokumen->path_file || ! Storage::disk('public')->exists($dokumen->path_file)) {
            return $this->errorResponse('Berkas dokumen termin tidak ditemukan.', 404);
        }

        $absolutePath = Storage::disk('public')->path($dokumen->path_file);
        $ext = pathinfo($absolutePath, PATHINFO_EXTENSION);
        $safeJenis = preg_replace('/[^A-Za-z0-9\-_.]/', '_', (string) $dokumen->jenis_dokumen);
        $filename = "termin-{$termin->nomor_termin}-{$safeJenis}".($ext ? ".{$ext}" : '');

        if ($request->boolean('download')) {
            return response()->download($absolutePath, $filename);
        }

        return response()->file($absolutePath, [
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }
}
