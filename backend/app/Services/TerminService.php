<?php

namespace App\Services;

use App\Models\DokumenTermin;
use App\Models\Proyek;
use App\Models\Termin;
use App\Support\Tanggal;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TerminService
{
    public function __construct(
        protected EarlyWarningService $earlyWarningService
    ) {}

    public function listForProject(Proyek $proyek): array
    {
        return Termin::where('id_proyek', $proyek->id_proyek)
            ->with('dokumenTermin')
            ->orderBy('nomor_termin')
            ->get()
            ->map(fn (Termin $t) => [
                'id_termin' => $t->id_termin,
                'nomor_termin' => $t->nomor_termin,
                'target_persentase' => (float) $t->target_persentase,
                'nilai_tagihan' => (float) $t->nilai_tagihan,
                'tenggat_waktu' => Tanggal::format($t->tenggat_waktu),
                'status_penagihan' => $t->status_penagihan,
                'estimasi_kerugian' => (float) $t->estimasi_kerugian,
                'tanggal_pengajuan' => Tanggal::format($t->tanggal_pengajuan),
                'nomor_surat_serah' => $t->nomor_surat_serah,
                'nomor_sp2d' => $t->nomor_sp2d,
                'tanggal_cair' => Tanggal::format($t->tanggal_cair),
                'catatan_koreksi_dinas' => $t->catatan_koreksi_dinas,
                'checklist' => $this->ringkasanChecklist($t),
            ])
            ->values()
            ->all();
    }

    public function checklist(Termin $termin): array
    {
        $termin->load('dokumenTermin');
        $wajib = config('pantera.dokumen_termin_wajib');
        $terunggah = $termin->dokumenTermin->keyBy('jenis_dokumen');

        $items = [];
        foreach ($wajib as $jenis => $label) {
            /** @var DokumenTermin|null $dok */
            $dok = $terunggah->get($jenis);
            $items[] = [
                'jenis_dokumen' => $jenis,
                'label' => $label,
                'diunggah' => $dok !== null,
                'id_dokumen' => $dok?->id_dokumen,
                'path_file' => $dok?->path_file,
                'url' => $dok ? Storage::disk('public')->url($dok->path_file) : null,
                'status_verifikasi' => (bool) $dok?->status_verifikasi,
                'catatan_revisi' => $dok?->catatan_revisi,
            ];
        }

        return [
            'termin' => [
                'id_termin' => $termin->id_termin,
                'id_proyek' => $termin->id_proyek,
                'nomor_termin' => $termin->nomor_termin,
                'target_persentase' => (float) $termin->target_persentase,
                'nilai_tagihan' => (float) $termin->nilai_tagihan,
                'tenggat_waktu' => Tanggal::format($termin->tenggat_waktu),
                'status_penagihan' => $termin->status_penagihan,
                'estimasi_kerugian' => (float) $termin->estimasi_kerugian,
                'catatan_koreksi_dinas' => $termin->catatan_koreksi_dinas,
            ],
            'dokumen_wajib' => $items,
            'ringkasan' => $this->ringkasanChecklist($termin),
            'peringatan' => $this->peringatanBerkas($termin),
        ];
    }

    public function uploadDokumen(Termin $termin, string $jenisDokumen, UploadedFile $file): DokumenTermin
    {
        $this->pastikanBelumDiajukan($termin);

        $dokumen = DB::transaction(function () use ($termin, $jenisDokumen, $file) {
            $path = $file->store('dokumen-termin', 'public');
            $lama = DokumenTermin::where('id_termin', $termin->id_termin)
                ->where('jenis_dokumen', $jenisDokumen)
                ->first();

            if ($lama) {
                // Ganti berkas: hapus file lama, verifikasi diulang dari awal.
                Storage::disk('public')->delete($lama->path_file);
                $lama->update([
                    'path_file' => $path,
                    'status_verifikasi' => false,
                    'catatan_revisi' => null,
                ]);

                return $lama;
            }

            return DokumenTermin::create([
                'id_termin' => $termin->id_termin,
                'jenis_dokumen' => $jenisDokumen,
                'path_file' => $path,
                'status_verifikasi' => false,
            ]);
        });

        $this->sinkronkanKesiapan($termin);

        return $dokumen->refresh();
    }

    /**
     * Memberi/mencabut tanda centang verifikasi pada satu dokumen.
     */
    public function verifikasiDokumen(Termin $termin, DokumenTermin $dokumen, bool $terverifikasi, ?string $catatanRevisi): DokumenTermin
    {
        $this->pastikanBelumDiajukan($termin);

        $dokumen->update([
            'status_verifikasi' => $terverifikasi,
            'catatan_revisi' => $terverifikasi ? null : $catatanRevisi,
        ]);

        $this->sinkronkanKesiapan($termin);

        return $dokumen->refresh();
    }

    /**
     * Menyelaraskan status_penagihan dengan kelengkapan checklist:
     * lengkap & terverifikasi -> 'Siap serah'; sebaliknya -> 'Belum siap'.
     * Tidak menyentuh termin yang sudah 'Diajukan ke Dinas' atau 'SP2D cair'.
     */
    public function sinkronkanKesiapan(Termin $termin): Termin
    {
        $termin->refresh();

        if (! in_array($termin->status_penagihan, [Termin::STATUS_BELUM_SIAP, Termin::STATUS_SIAP_SERAH], true)) {
            return $termin;
        }

        $statusBaru = $this->checklistLengkap($termin)
            ? Termin::STATUS_SIAP_SERAH
            : Termin::STATUS_BELUM_SIAP;

        if ($statusBaru !== $termin->status_penagihan) {
            $termin->update(['status_penagihan' => $statusBaru]);
        }

        return $termin;
    }

    /**
     * Seluruh dokumen wajib sudah diunggah DAN terverifikasi.
     */
    public function checklistLengkap(Termin $termin): bool
    {
        $wajib = array_keys(config('pantera.dokumen_termin_wajib'));
        $verified = $termin->dokumenTermin()
            ->whereIn('jenis_dokumen', $wajib)
            ->where('status_verifikasi', true)
            ->pluck('jenis_dokumen')
            ->unique();

        return $verified->count() === count($wajib);
    }

    protected function ringkasanChecklist(Termin $termin): array
    {
        $wajib = array_keys(config('pantera.dokumen_termin_wajib'));
        $dokumen = $termin->relationLoaded('dokumenTermin')
            ? $termin->dokumenTermin
            : $termin->dokumenTermin()->get();
        $dokumen = $dokumen->whereIn('jenis_dokumen', $wajib);

        $total = count($wajib);
        $terverifikasi = $dokumen->where('status_verifikasi', true)->pluck('jenis_dokumen')->unique()->count();

        return [
            'total' => $total,
            'diunggah' => $dokumen->pluck('jenis_dokumen')->unique()->count(),
            'terverifikasi' => $terverifikasi,
            'persen' => round($terverifikasi / $total * 100, 2),
            'lengkap' => $terverifikasi === $total,
        ];
    }

    //  * Peringatan kritis jika berkas belum lengkap menjelang tenggat (UC-10 A1).
    protected function peringatanBerkas(Termin $termin): ?array
    {
        if (! in_array($termin->status_penagihan, [Termin::STATUS_BELUM_SIAP, Termin::STATUS_SIAP_SERAH], true)) {
            return null;
        }
        if ($this->checklistLengkap($termin)) {
            return null;
        }

        $hariKeTenggat = $this->earlyWarningService->selisihHari(now(), Tanggal::carbon($termin->tenggat_waktu));

        if ($hariKeTenggat > (int) config('pantera.checklist.ambang_hari_peringatan')) {
            return null;
        }

        // Hari penundaan: prediksi early warning (jika ini termin berjalan) atau hari yang sudah terlewat.
        $ew = $this->earlyWarningService->evaluate(Proyek::findOrFail($termin->id_proyek));
        $hariTunda = ($ew['termin_berjalan']['id_termin'] ?? null) === $termin->id_termin
            ? $ew['prediksi']['estimasi_hari_terlambat']
            : 0;
        $hariTunda = max($hariTunda, max(0, -$hariKeTenggat));

        $perHari = $this->earlyWarningService->kerugianPerHari($termin);

        return [
            'level' => $hariKeTenggat < 0 ? 'Kritis' : 'Waspada',
            'hari_ke_tenggat' => $hariKeTenggat,
            'kerugian_per_hari' => round($perHari, 2),
            'estimasi_hari_tertunda' => $hariTunda,
            'estimasi_kerugian' => round($perHari * $hariTunda, 2),
            'pesan' => $hariKeTenggat < 0
                ? 'Tenggat termin sudah terlewat dan berkas belum lengkap.'
                : "Tenggat {$hariKeTenggat} hari lagi, berkas belum lengkap.",
        ];
    }

    protected function pastikanBelumDiajukan(Termin $termin): void
    {
        if (in_array($termin->status_penagihan, [Termin::STATUS_DIAJUKAN, Termin::STATUS_SP2D_CAIR], true)) {
            throw ValidationException::withMessages([
                'status_penagihan' => 'Dokumen tidak dapat diubah karena termin berstatus '.$termin->status_penagihan.'.',
            ]);
        }
    }
}
