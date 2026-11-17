<?php

namespace App\Services;

use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Models\Termin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    /**
     * Generate kode proyek berurutan (P001, P002, dst.).
     * Menggunakan LIKE dan regex filter di level PHP agar kompatibel dengan SQLite, MySQL, dan PostgreSQL.
     */
    public function generateKodeProyek(): string
    {
        $lastProyek = Proyek::where('kode_proyek', 'like', 'P%')
            ->orderBy('id_proyek', 'desc')
            ->limit(50)
            ->get()
            ->first(function (Proyek $proyek) {
                return preg_match('/^P\d+$/', (string) $proyek->kode_proyek) === 1;
            });

        if (! $lastProyek || ! preg_match('/^P(\d+)$/', (string) $lastProyek->kode_proyek, $matches)) {
            return 'P001';
        }

        $nextNumber = ((int) $matches[1]) + 1;

        return sprintf('P%03d', $nextNumber);
    }

    /**
     * Menyimpan proyek baru, menetapkan RAB, dan membuat tahapan termin (UC-12 & SD-08).
     *
     * @param  array<string, mixed>  $data
     */
    public function createProject(array $data, int $pembuatId): Proyek
    {
        return DB::transaction(function () use ($data, $pembuatId) {
            $kodeProyek = ! empty($data['kode_proyek'])
                ? $data['kode_proyek']
                : $this->generateKodeProyek();

            // 1. Simpan entitas Proyek
            $proyek = Proyek::create([
                'id_pembuat' => $pembuatId,
                'kode_proyek' => $kodeProyek,
                'nama_proyek' => $data['nama_proyek'],
                'dinas_pemberi_kerja' => $data['dinas_pemberi_kerja'],
                'nilai_kontrak' => $data['nilai_kontrak'],
                'tanggal_mulai' => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'status_proyek' => 'Aktif',
            ]);

            // 2. Simpan entitas RAB (1-to-1 dengan proyek, sisa pagu awal = total pagu)
            $proyek->rab()->create([
                'total_pagu' => $data['total_pagu'],
                'sisa_pagu' => $data['total_pagu'],
                'tanggal_ditetapkan' => now()->toDateString(),
                'versi_rab' => '1',
            ]);

            // 3. Simpan seluruh tahapan Termin
            foreach ($data['termin'] as $item) {
                $proyek->termin()->create([
                    'nomor_termin' => $item['nomor_termin'],
                    'target_persentase' => $item['target_persentase'],
                    'nilai_tagihan' => $item['nilai_tagihan'],
                    'tenggat_waktu' => $item['tenggat_waktu'],
                    'status_penagihan' => 'Belum siap',
                    'estimasi_kerugian' => 0,
                ]);
            }

            return $proyek->load(['rab', 'termin']);
        });
    }

    /**
     * Mengambil katalog daftar proyek dengan filter pencarian dan ringkasan operasional.
     *
     * @return Collection<int, mixed>
     */
    public function getProjectList(?string $keyword = null, ?string $statusProyek = null): Collection
    {
        $query = Proyek::with([
            'rab',
            'termin' => fn ($q) => $q->orderBy('nomor_termin', 'asc'),
            'progresFisik' => fn ($q) => $q->latest('tanggal_lapor')->latest('id_progres'),
        ]);

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('nama_proyek', 'like', "%{$keyword}%")
                    ->orWhere('kode_proyek', 'like', "%{$keyword}%")
                    ->orWhere('dinas_pemberi_kerja', 'like', "%{$keyword}%");
            });
        }

        if ($statusProyek) {
            $query->where('status_proyek', $statusProyek);
        }

        $projects = $query->latest('id_proyek')->get();

        /** @var Collection<int, mixed> $result */
        $result = $projects->map(function ($proyek) {
            /** @var Proyek $proyek */
            // Posisi termin berjalan: termin terdekat yang belum cair SP2D
            /** @var Termin|null $terminBerjalan */
            $terminBerjalan = $proyek->termin->firstWhere('status_penagihan', '!=', 'SP2D cair')
                ?? $proyek->termin->last();

            // Progres fisik terakhir
            /** @var ProgresFisik|null $progresTerakhir */
            $progresTerakhir = $proyek->progresFisik->first();
            $persentaseProgres = $progresTerakhir ? (float) $progresTerakhir->persentase_realisasi : 0.0;

            $totalPagu = $proyek->rab ? (float) $proyek->rab->total_pagu : 0.0;
            $sisaPagu = $proyek->rab ? (float) $proyek->rab->sisa_pagu : 0.0;
            $versiRab = $proyek->rab ? (string) $proyek->rab->versi_rab : '1';

            $tglMulai = $proyek->tanggal_mulai instanceof \DateTimeInterface
                ? $proyek->tanggal_mulai->format('Y-m-d')
                : (string) $proyek->tanggal_mulai;

            $tglSelesai = $proyek->tanggal_selesai instanceof \DateTimeInterface
                ? $proyek->tanggal_selesai->format('Y-m-d')
                : (string) $proyek->tanggal_selesai;

            $tenggatTermin = null;
            if ($terminBerjalan) {
                $tenggatTermin = $terminBerjalan->tenggat_waktu instanceof \DateTimeInterface
                    ? $terminBerjalan->tenggat_waktu->format('Y-m-d')
                    : (string) $terminBerjalan->tenggat_waktu;
            }

            return [
                'id_proyek' => $proyek->id_proyek,
                'kode_proyek' => $proyek->kode_proyek,
                'nama_proyek' => $proyek->nama_proyek,
                'dinas_pemberi_kerja' => $proyek->dinas_pemberi_kerja,
                'nilai_kontrak' => (float) $proyek->nilai_kontrak,
                'tanggal_mulai' => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'status_proyek' => $proyek->status_proyek,
                'ringkasan_rab' => [
                    'total_pagu' => $totalPagu,
                    'sisa_pagu' => $sisaPagu,
                    'versi_rab' => $versiRab,
                ],
                'posisi_termin_berjalan' => $terminBerjalan ? [
                    'id_termin' => $terminBerjalan->id_termin,
                    'nomor_termin' => $terminBerjalan->nomor_termin,
                    'target_persentase' => (float) $terminBerjalan->target_persentase,
                    'nilai_tagihan' => (float) $terminBerjalan->nilai_tagihan,
                    'tenggat_waktu' => $tenggatTermin,
                    'status_penagihan' => $terminBerjalan->status_penagihan,
                ] : null,
                'progres_fisik_terakhir' => [
                    'persentase_realisasi' => $persentaseProgres,
                    'tanggal_lapor' => $progresTerakhir?->tanggal_lapor instanceof \DateTimeInterface
                        ? $progresTerakhir->tanggal_lapor->format('Y-m-d')
                        : (string) $progresTerakhir?->tanggal_lapor,
                ],
                'created_at' => $proyek->created_at?->toDateTimeString(),
            ];
        });

        return $result;
    }

    /**
     * Mengambil detail lengkap satu proyek (getDetailProyek, getRekapProgres, getStatusTermin).
     *
     * @return array<string, mixed>|null
     */
    public function getProjectDetail(int $idProyek): ?array
    {
        $proyek = Proyek::with([
            'pembuat',
            'rab',
            'termin' => fn ($q) => $q->orderBy('nomor_termin', 'asc')->with('dokumenTermin'),
            'progresFisik' => fn ($q) => $q->latest('tanggal_lapor')->latest('id_progres')->with(['pelapor', 'kendalaLapangan']),
        ])->find($idProyek);

        if (! $proyek) {
            return null;
        }

        // Hitung rekap progres & status termin
        $progresTerakhir = $proyek->progresFisik->first();
        $persentaseProgres = $progresTerakhir ? (float) $progresTerakhir->persentase_realisasi : 0.0;

        $totalTermin = $proyek->termin->count();
        $terminCair = $proyek->termin->where('status_penagihan', 'SP2D cair')->count();
        $totalTagihanCair = (float) $proyek->termin->where('status_penagihan', 'SP2D cair')->sum('nilai_tagihan');
        $sisaTagihan = (float) $proyek->nilai_kontrak - $totalTagihanCair;

        return [
            'proyek' => $proyek,
            'rekap_progres' => [
                'persentase_realisasi_terakhir' => $persentaseProgres,
                'tanggal_lapor_terakhir' => $progresTerakhir?->tanggal_lapor?->format('Y-m-d'),
                'total_laporan_progres' => $proyek->progresFisik->count(),
            ],
            'rekap_termin' => [
                'total_termin' => $totalTermin,
                'termin_cair' => $terminCair,
                'termin_belum_cair' => $totalTermin - $terminCair,
                'total_tagihan_cair' => $totalTagihanCair,
                'sisa_tagihan' => $sisaTagihan,
            ],
        ];
    }
}
