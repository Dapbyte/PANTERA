<?php

namespace App\Services;

use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Models\Termin;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProgressService
{
    public function __construct(
        protected EarlyWarningService $earlyWarningService
    ) {}

    // Menyimpan milestone progres, mengevaluasi termin, dan menyegarkan early warning

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, UploadedFile>  $fotos
     * @return array<string, mixed>
     */
    public function create(Proyek $proyek, int $pelaporId, array $data, ?UploadedFile $foto = null, array $fotos = []): array
    {
        $persentase = (float) $data['persentase_realisasi'];
        $tertinggi = (float) $proyek->progresFisik()->max('persentase_realisasi');

        if ($persentase < $tertinggi) {
            throw ValidationException::withMessages([
                'persentase_realisasi' => "Capaian kumulatif tidak boleh lebih kecil dari laporan sebelumnya ({$tertinggi}%).",
            ]);
        }

        $uploadedFiles = [];
        if ($foto instanceof UploadedFile) {
            $uploadedFiles[] = $foto;
        }
        foreach ($fotos as $extra) {
            if ($extra instanceof UploadedFile) {
                $uploadedFiles[] = $extra;
            }
        }

        $progres = DB::transaction(function () use ($proyek, $pelaporId, $data, $uploadedFiles, $persentase) {
            $storedPaths = [];
            foreach ($uploadedFiles as $file) {
                $path = $file->store('progres', 'public');
                if (is_string($path) && $path !== '') {
                    $storedPaths[] = $path;
                }
            }

            return ProgresFisik::create([
                'id_proyek' => $proyek->id_proyek,
                'id_pelapor' => $pelaporId,
                'tanggal_lapor' => $data['tanggal_lapor'] ?? now()->toDateString(),
                'persentase_realisasi' => $persentase,
                'deskripsi_pekerjaan' => $data['deskripsi_pekerjaan'],
                'path_foto' => $storedPaths[0] ?? null,
                'foto_paths' => count($storedPaths) > 0 ? $storedPaths : null,
                'verifikasi_pengawas' => false,
            ]);
        });

        return [
            'progres' => $progres,
            'milestone_tercapai' => $this->evaluasiMilestone($proyek, $persentase),
            'early_warning' => $this->earlyWarningService->refresh($proyek),
        ];
    }

    // milestone tercapai

    public function evaluasiMilestone(Proyek $proyek, float $persentase): array
    {
        return Termin::where('id_proyek', $proyek->id_proyek)
            ->whereIn('status_penagihan', [Termin::STATUS_BELUM_SIAP, Termin::STATUS_SIAP_SERAH])
            ->where('target_persentase', '<=', $persentase)
            ->orderBy('nomor_termin')
            ->get()
            ->map(fn (Termin $t) => [
                'id_termin' => $t->id_termin,
                'nomor_termin' => $t->nomor_termin,
                'target_persentase' => (float) $t->target_persentase,
                'status_penagihan' => $t->status_penagihan,
                'pesan' => "Milestone Termin {$t->nomor_termin} tercapai. Lengkapi checklist dokumen termin untuk memulai penagihan.",
            ])
            ->values()
            ->all();
    }

    // riwayat progres

    public function listForProject(Proyek $proyek): Collection
    {
        return ProgresFisik::where('id_proyek', $proyek->id_proyek)
            ->with(['pelapor:id_pengguna,nama', 'kendalaLapangan'])
            ->orderByDesc('tanggal_lapor')
            ->orderByDesc('id_progres')
            ->get();
    }

    /**
     * Menandai atau mencabut verifikasi pengawas pada laporan progres fisik.
     */
    public function verifikasiPengawas(ProgresFisik $progres, bool $verified): ProgresFisik
    {
        $progres->update(['verifikasi_pengawas' => $verified]);

        return $progres->refresh()->load(['pelapor:id_pengguna,nama', 'kendalaLapangan']);
    }
}
