<?php

namespace App\Services;

use App\Models\FasilitasKredit;
use App\Models\Proyek;
use Illuminate\Database\Eloquent\Collection;

class BankCreditService
{
    public function __construct(
        protected ProjectService $projectService,
        protected EarlyWarningService $earlyWarningService,
        protected ProgressService $progressService,
        protected KendalaService $kendalaService
    ) {}

    /**
     * Daftar fasilitas kredit & riwayat koordinasi bank (UC-05).
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, FasilitasKredit>
     */
    public function list(array $filters = []): Collection
    {
        $query = FasilitasKredit::with([
            'proyek:id_proyek,kode_proyek,nama_proyek,dinas_pemberi_kerja,nilai_kontrak',
            'pencatat:id_pengguna,nama,email,peran',
        ]);

        if (! empty($filters['id_proyek'])) {
            $query->where('id_proyek', (int) $filters['id_proyek']);
        }

        if (! empty($filters['status_koordinasi'])) {
            $query->where('status_koordinasi', $filters['status_koordinasi']);
        }

        if (! empty($filters['q'])) {
            $q = (string) $filters['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('nama_bank', 'like', "%{$q}%")
                    ->orWhere('nomor_fasilitas', 'like', "%{$q}%")
                    ->orWhereHas('proyek', function ($p) use ($q) {
                        $p->where('nama_proyek', 'like', "%{$q}%")
                            ->orWhere('kode_proyek', 'like', "%{$q}%");
                    });
            });
        }

        return $query->latest('id_kredit')->get();
    }

    /**
     * Mencatat koordinasi / pengajuan fasilitas kredit baru ke bank rekanan (UC-05).
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $pencatatId): FasilitasKredit
    {
        $kredit = FasilitasKredit::create([
            'id_proyek' => $data['id_proyek'],
            'id_pencatat' => $pencatatId,
            'nama_bank' => $data['nama_bank'],
            'nomor_fasilitas' => $data['nomor_fasilitas'] ?? null,
            'plafon_kredit' => $data['plafon_kredit'],
            'suku_bunga' => $data['suku_bunga'] ?? null,
            'tenor_bulan' => $data['tenor_bulan'],
            'tanggal_koordinasi' => $data['tanggal_koordinasi'] ?? now()->toDateString(),
            'tanggal_jatuh_tempo_baru' => $data['tanggal_jatuh_tempo_baru'] ?? null,
            'status_koordinasi' => $data['status_koordinasi'] ?? FasilitasKredit::STATUS_DIAJUKAN,
            'catatan_kesepakatan' => $data['catatan_kesepakatan'] ?? null,
        ]);

        return $kredit->load([
            'proyek:id_proyek,kode_proyek,nama_proyek,dinas_pemberi_kerja,nilai_kontrak',
            'pencatat:id_pengguna,nama,email,peran',
        ]);
    }

    /**
     * Memperbarui hasil kesepakatan koordinasi kredit bank (UC-05).
     *
     * @param  array<string, mixed>  $data
     */
    public function update(FasilitasKredit $kredit, array $data): FasilitasKredit
    {
        $kredit->update($data);

        return $kredit->refresh()->load([
            'proyek:id_proyek,kode_proyek,nama_proyek,dinas_pemberi_kerja,nilai_kontrak',
            'pencatat:id_pengguna,nama,email,peran',
        ]);
    }

    /**
     * Menghasilkan paket ringkasan laporan performa proyek resmi untuk koordinasi bank (UC-05).
     *
     * @return array<string, mixed>
     */
    public function generatePerformanceReport(Proyek $proyek): array
    {
        return [
            'generated_at' => now()->toIso8601String(),
            'proyek_detail' => $this->projectService->getProjectDetail((int) $proyek->id_proyek),
            'early_warning' => $this->earlyWarningService->analyze($proyek),
            'riwayat_progres' => $this->progressService->listForProject($proyek),
            'riwayat_kendala' => $this->kendalaService->listForProject($proyek),
            'fasilitas_kredit' => FasilitasKredit::where('id_proyek', $proyek->id_proyek)
                ->with('pencatat:id_pengguna,nama')
                ->latest('id_kredit')
                ->get(),
        ];
    }
}
