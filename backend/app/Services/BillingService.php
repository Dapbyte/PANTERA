<?php

namespace App\Services;

use App\Models\Proyek;
use App\Models\Termin;
use App\Support\Tanggal;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Penagihan termin ke dinas & status SP2D (UC-06 & SD-06).
 *
 * Alur status_penagihan:
 *   Belum siap <-> Siap serah -> Diajukan ke Dinas -> SP2D cair
 *                     ^                  |
 *                     +---- koreksi -----+  (dinas mengembalikan berkas)
 */
class BillingService
{
    public function __construct(
        protected TerminService $terminService,
        protected EarlyWarningService $earlyWarningService
    ) {}

    /**
     * Mengajukan tagihan ke dinas: 'Siap serah' -> 'Diajukan ke Dinas'.
     *
     * @param  array<string, mixed>  $data
     */
    public function ajukan(Termin $termin, array $data): Termin
    {
        $this->pastikanStatus($termin, Termin::STATUS_SIAP_SERAH, 'Hanya termin berstatus "Siap serah" yang dapat diajukan ke dinas.');

        $termin->update([
            'status_penagihan' => Termin::STATUS_DIAJUKAN,
            'nomor_surat_serah' => $data['nomor_surat_serah'],
            'tanggal_pengajuan' => $data['tanggal_pengajuan'] ?? now()->toDateString(),
            'catatan_koreksi_dinas' => null,
            'estimasi_kerugian' => 0,
        ]);

        $this->earlyWarningService->refresh(Proyek::findOrFail($termin->id_proyek));

        return $termin->refresh();
    }

    /**
     * Berkas dikembalikan dinas (UC-06 A1): catat koreksi, tandai dokumen yang perlu direvisi,
     * lalu status mengikuti kelengkapan checklist (ada dokumen ditandai -> 'Belum siap').
     *
     * @param  array<string, mixed>  $data
     */
    public function koreksi(Termin $termin, array $data): Termin
    {
        $this->pastikanStatus($termin, Termin::STATUS_DIAJUKAN, 'Koreksi dinas hanya dapat dicatat pada termin berstatus "Diajukan ke Dinas".');

        DB::transaction(function () use ($termin, $data) {
            foreach ($data['dokumen'] ?? [] as $item) {
                $dokumen = $termin->dokumenTermin()->find($item['id_dokumen']);

                if (! $dokumen) {
                    throw ValidationException::withMessages([
                        'dokumen' => "Dokumen {$item['id_dokumen']} tidak termasuk dalam termin ini.",
                    ]);
                }

                $dokumen->update([
                    'status_verifikasi' => false,
                    'catatan_revisi' => $item['catatan_revisi'],
                ]);
            }

            $termin->update([
                'status_penagihan' => Termin::STATUS_BELUM_SIAP,
                'catatan_koreksi_dinas' => $data['catatan_koreksi_dinas'],
                'tanggal_pengajuan' => null,
                'nomor_surat_serah' => null,
            ]);
        });

        $termin = $this->terminService->sinkronkanKesiapan($termin);
        $this->earlyWarningService->refresh(Proyek::findOrFail($termin->id_proyek));

        return $termin->refresh();
    }

    /**
     * Mencatat pencairan SP2D: 'Diajukan ke Dinas' -> 'SP2D cair'.
     *
     * @param  array<string, mixed>  $data
     */
    public function cairkan(Termin $termin, array $data): Termin
    {
        $this->pastikanStatus($termin, Termin::STATUS_DIAJUKAN, 'SP2D hanya dapat dicatat pada termin berstatus "Diajukan ke Dinas".');

        $tanggalCair = Carbon::parse($data['tanggal_cair'])->startOfDay();

        if ($termin->tanggal_pengajuan && $tanggalCair->lt(Tanggal::carbon($termin->tanggal_pengajuan)->startOfDay())) {
            throw ValidationException::withMessages([
                'tanggal_cair' => 'Tanggal pencairan tidak boleh sebelum tanggal pengajuan.',
            ]);
        }

        $termin->update([
            'status_penagihan' => Termin::STATUS_SP2D_CAIR,
            'nomor_sp2d' => $data['nomor_sp2d'],
            'tanggal_cair' => $tanggalCair->toDateString(),
            'estimasi_kerugian' => 0,
        ]);

        $this->earlyWarningService->refresh(Proyek::findOrFail($termin->id_proyek));

        return $termin->refresh();
    }

    protected function pastikanStatus(Termin $termin, string $diharapkan, string $pesan): void
    {
        if ($termin->status_penagihan !== $diharapkan) {
            throw ValidationException::withMessages(['status_penagihan' => $pesan]);
        }
    }
}
