<?php

namespace App\Services;

use App\Models\KendalaLapangan;
use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Support\Tanggal;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KendalaService
{
    public function __construct(
        protected EarlyWarningService $earlyWarningService
    ) {}

    // Mencatat kendala dan memicu early warning
    // Kalau ID gaada, pake pakali laporan progres terbaru
    // Kendala wajib nempel sama satu laporan progres

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, UploadedFile>  $fotos
     * @return array<string, mixed>
     */
    public function create(Proyek $proyek, array $data, ?UploadedFile $foto = null, array $fotos = []): array
    {
        $laporanProyek = ProgresFisik::where('id_proyek', $proyek->id_proyek);
        $progres = isset($data['id_progres'])
            ? $laporanProyek->find($data['id_progres'])
            : $laporanProyek->orderByDesc('tanggal_lapor')->orderByDesc('id_progres')->first();

        if (! $progres) {
            throw ValidationException::withMessages([
                'id_progres' => isset($data['id_progres'])
                    ? 'Laporan progres tidak ditemukan pada proyek ini.'
                    : 'Belum ada laporan progres pada proyek ini. Input progres fisik terlebih dahulu.',
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

        $kendala = DB::transaction(function () use ($progres, $data, $uploadedFiles) {
            $storedPaths = [];
            foreach ($uploadedFiles as $file) {
                $path = $file->store('kendala', 'public');
                if (is_string($path) && $path !== '') {
                    $storedPaths[] = $path;
                }
            }

            return KendalaLapangan::create([
                'id_progres' => $progres->id_progres,
                'tanggal_kejadian' => $data['tanggal_kejadian'] ?? now()->toDateString(),
                'kategori_kendala' => $data['kategori_kendala'],
                'tingkat_keparahan' => $data['tingkat_keparahan'],
                'deskripsi_kendala' => $data['deskripsi_kendala'],
                'estimasi_hari_tertunda' => $data['estimasi_hari_tertunda'],
                'status_penanganan' => KendalaLapangan::STATUS_AKTIF,
                'path_foto' => $storedPaths[0] ?? null,
                'foto_paths' => count($storedPaths) > 0 ? $storedPaths : null,
            ]);
        });

        return [
            'kendala' => $kendala,
            'early_warning' => $this->earlyWarningService->refresh($proyek),
        ];
    }

    // Menandai kendala selesai
    public function resolve(KendalaLapangan $kendala, array $data): array
    {
        if ($kendala->status_penanganan === KendalaLapangan::STATUS_RESOLVED) {
            throw ValidationException::withMessages([
                'status_penanganan' => 'Kendala ini sudah berstatus Resolved.',
            ]);
        }

        $tanggalResolved = Carbon::parse($data['tanggal_resolved'] ?? now()->toDateString())->startOfDay();

        if ($tanggalResolved->lt(Tanggal::carbon($kendala->tanggal_kejadian)->startOfDay())) {
            throw ValidationException::withMessages([
                'tanggal_resolved' => 'Tanggal penyelesaian tidak boleh sebelum tanggal kejadian.',
            ]);
        }

        $kendala->update([
            'status_penanganan' => KendalaLapangan::STATUS_RESOLVED,
            'tanggal_resolved' => $tanggalResolved->toDateString(),
            'catatan_penyelesaian' => $data['catatan_penyelesaian'],
        ]);

        $proyek = Proyek::findOrFail(ProgresFisik::findOrFail($kendala->id_progres)->id_proyek);

        return [
            'kendala' => $kendala->refresh(),
            'early_warning' => $this->earlyWarningService->refresh($proyek),
        ];
    }

    /**
     * Daftar kendala proyek (terbaru dulu), dapat difilter status penanganan.
     *
     * @return Collection<int, KendalaLapangan>
     */
    public function listForProject(Proyek $proyek, ?string $status = null): Collection
    {
        return KendalaLapangan::whereIn(
            'id_progres',
            ProgresFisik::where('id_proyek', $proyek->id_proyek)->select('id_progres')
        )
            ->when($status, fn ($q) => $q->where('status_penanganan', $status))
            ->orderByDesc('tanggal_kejadian')
            ->orderByDesc('id_kendala')
            ->get();
    }
}
