<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveMaterialRequest;
use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Requests\ValidateMaterialRequest;
use App\Models\RequestMaterial;
use App\Models\User;
use App\Services\MaterialService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MaterialService $materialService
    ) {}

    /**
     * Daftar seluruh pengajuan material (terfilter akses proyek & sanitasi harga untuk Admin Lapangan).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $materials = $this->materialService->list(
            $request->only(['id_proyek', 'status_approval', 'sifat_pengajuan', 'q']),
            $user->allowedProyekIds()
        );

        $serialized = $materials
            ->map(fn (RequestMaterial $m) => $this->materialService->serializeForUser($m, $user))
            ->values()
            ->all();

        return $this->successResponse($serialized, 'Daftar pengajuan material berhasil dimuat.');
    }

    /**
     * Detail lengkap pengajuan material (harga disterilkan untuk Admin Lapangan).
     */
    public function show(Request $request, int $id_request): JsonResponse
    {
        $material = $this->materialService->findDetail($id_request);

        if (! $material) {
            return $this->errorResponse('Pengajuan material tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $material->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        return $this->successResponse(
            $this->materialService->serializeForUser($material, $user),
            'Detail pengajuan material berhasil dimuat.'
        );
    }

    /**
     * Admin Lapangan mengajukan kebutuhan material (hanya item & volume, tanpa harga).
     */
    public function store(StoreMaterialRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $idProyek = (int) $request->validated('id_proyek');

        if (! $user->canAccessProyek($idProyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        $material = $this->materialService->create($request->validated(), $user);

        return $this->successResponse(
            $this->materialService->serializeForUser($material, $user),
            'Pengajuan material berhasil dikirim ke Keuangan.',
            201
        );
    }

    /**
     * Admin Lapangan merevisi dan mengajukan ulang request berstatus 'Perlu Revisi'.
     */
    public function update(UpdateMaterialRequest $request, int $id_request): JsonResponse
    {
        $material = RequestMaterial::find($id_request);

        if (! $material) {
            return $this->errorResponse('Pengajuan material tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $user->canAccessProyek((int) $material->id_proyek)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki akses ke proyek ini.', 403);
        }

        if ((int) $material->id_pengaju !== (int) $user->id_pengguna) {
            return $this->errorResponse('Akses ditolak: Anda hanya dapat merevisi pengajuan yang Anda buat.', 403);
        }

        $updated = $this->materialService->revise($material, $user, $request->validated());

        return $this->successResponse(
            $this->materialService->serializeForUser($updated, $user),
            'Pengajuan material berhasil direvisi dan diajukan ulang.'
        );
    }

    /**
     * Keuangan mengisi vendor + harga satuan per item atau menolak dengan alasan.
     */
    public function validateFinance(ValidateMaterialRequest $request, int $id_request): JsonResponse
    {
        $material = RequestMaterial::find($id_request);

        if (! $material) {
            return $this->errorResponse('Pengajuan material tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        $updated = $this->materialService->validateFinance($material, $user, $request->validated());

        $message = $updated->status_approval === RequestMaterial::STATUS_PERLU_REVISI
            ? 'Pengajuan dikembalikan ke Admin Lapangan untuk revisi.'
            : 'Harga & vendor terisi. Pengajuan diteruskan ke Direktur.';

        return $this->successResponse($this->materialService->serializeForUser($updated, $user), $message);
    }

    /**
     * Keputusan persetujuan akhir pengajuan material oleh Direktur.
     */
    public function approve(ApproveMaterialRequest $request, int $id_request): JsonResponse
    {
        $material = RequestMaterial::find($id_request);

        if (! $material) {
            return $this->errorResponse('Pengajuan material tidak ditemukan.', 404);
        }

        /** @var User $user */
        $user = $request->user();
        $updated = $this->materialService->approve($material, $user, $request->validated());

        $message = $updated->status_approval === RequestMaterial::STATUS_SELESAI
            ? 'Pengajuan material disetujui (Selesai) dan Purchase Order berhasil diterbitkan.'
            : 'Pengajuan material dikembalikan untuk revisi dengan catatan Direktur.';

        return $this->successResponse($this->materialService->serializeForUser($updated, $user), $message);
    }
}
