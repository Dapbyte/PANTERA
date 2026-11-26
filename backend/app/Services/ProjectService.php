<?php

namespace App\Services;

use App\Models\ArsipDokumen;
use App\Models\DokumenTermin;
use App\Models\FasilitasKredit;
use App\Models\KendalaLapangan;
use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Models\RequestMaterial;
use App\Models\Termin;
use App\Models\TransaksiPembelian;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProjectService
{
    /**
     * Generate kode proyek berurutan (P001, P002, dst.).
     * Menggunakan LIKE dan regex filter di level PHP agar kompatibel dengan SQLite dan MySQL.
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
     * Menyimpan proyek baru, menetapkan RAB, tahapan termin, dan akses Admin Lapangan (UC-12, GLB-14).
     *
     * @param  array<string, mixed>  $data
     */
    public function createProject(array $data, int $pembuatId): Proyek
    {
        return DB::transaction(function () use ($data, $pembuatId) {
            $kodeProyek = ! empty($data['kode_proyek'])
                ? $data['kode_proyek']
                : $this->generateKodeProyek();

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

            $proyek->rab()->create([
                'total_pagu' => $data['total_pagu'],
                'sisa_pagu' => $data['total_pagu'],
                'tanggal_ditetapkan' => now()->toDateString(),
                'versi_rab' => '1',
            ]);

            foreach ($data['termin'] as $item) {
                $proyek->termin()->create([
                    'nomor_termin' => $item['nomor_termin'],
                    'target_persentase' => $item['target_persentase'],
                    'nilai_tagihan' => $item['nilai_tagihan'],
                    'tenggat_waktu' => $item['tenggat_waktu'],
                    'status_penagihan' => Termin::STATUS_BELUM_SIAP,
                    'estimasi_kerugian' => 0,
                ]);
            }

            if (! empty($data['admin_lapangan_ids']) && is_array($data['admin_lapangan_ids'])) {
                $validIds = User::whereIn('id_pengguna', $data['admin_lapangan_ids'])
                    ->where('peran', 'AdminLapangan')
                    ->pluck('id_pengguna')
                    ->all();
                $proyek->adminLapanganAkses()->sync($validIds);
            }

            return $proyek->load(['rab', 'termin', 'adminLapanganAkses:id_pengguna,nama,email']);
        });
    }

    /**
     * Memperbarui proyek, RAB, tahapan termin, serta penugasan Admin Lapangan (DIR-03, GLB-14).
     *
     * @param  array<string, mixed>  $data
     */
    public function updateProject(Proyek $proyek, array $data): Proyek
    {
        return DB::transaction(function () use ($proyek, $data) {
            $proyek->update([
                'nama_proyek' => $data['nama_proyek'],
                'dinas_pemberi_kerja' => $data['dinas_pemberi_kerja'],
                'nilai_kontrak' => $data['nilai_kontrak'],
                'tanggal_mulai' => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'status_proyek' => $data['status_proyek'] ?? $proyek->status_proyek,
            ]);

            $rab = $proyek->rab()->first();
            $newTotalPagu = (float) $data['total_pagu'];
            if ($rab) {
                $realisasiTerpakai = max(0.0, round((float) $rab->total_pagu - (float) $rab->sisa_pagu, 2));
                $newSisaPagu = max(0.0, round($newTotalPagu - $realisasiTerpakai, 2));
                $rab->update([
                    'total_pagu' => $newTotalPagu,
                    'sisa_pagu' => $newSisaPagu,
                    'versi_rab' => (string) (((int) $rab->versi_rab) + 1),
                ]);
            } else {
                $proyek->rab()->create([
                    'total_pagu' => $newTotalPagu,
                    'sisa_pagu' => $newTotalPagu,
                    'tanggal_ditetapkan' => now()->toDateString(),
                    'versi_rab' => '1',
                ]);
            }

            $existingTermins = Termin::where('id_proyek', $proyek->id_proyek)
                ->get()
                ->keyBy('id_termin');
            $submittedIds = [];

            foreach ($data['termin'] as $item) {
                $idTermin = ! empty($item['id_termin']) ? (int) $item['id_termin'] : null;
                $termin = $idTermin ? $existingTermins->get($idTermin) : null;
                if ($termin instanceof Termin) {
                    $termin->update([
                        'nomor_termin' => $item['nomor_termin'],
                        'target_persentase' => $item['target_persentase'],
                        'nilai_tagihan' => $item['nilai_tagihan'],
                        'tenggat_waktu' => $item['tenggat_waktu'],
                    ]);
                    $submittedIds[] = $idTermin;
                } else {
                    $created = $proyek->termin()->create([
                        'nomor_termin' => $item['nomor_termin'],
                        'target_persentase' => $item['target_persentase'],
                        'nilai_tagihan' => $item['nilai_tagihan'],
                        'tenggat_waktu' => $item['tenggat_waktu'],
                        'status_penagihan' => Termin::STATUS_BELUM_SIAP,
                        'estimasi_kerugian' => 0,
                    ]);
                    $submittedIds[] = (int) $created->id_termin;
                }
            }

            foreach ($existingTermins as $existingId => $termin) {
                if ($termin instanceof Termin && ! in_array((int) $existingId, $submittedIds, true)) {
                    if ($termin->status_penagihan !== Termin::STATUS_BELUM_SIAP) {
                        throw ValidationException::withMessages([
                            'termin' => "Termin {$termin->nomor_termin} berstatus '{$termin->status_penagihan}' sehingga tidak dapat dihapus.",
                        ]);
                    }
                    DokumenTermin::where('id_termin', $termin->id_termin)->delete();
                    $termin->delete();
                }
            }

            if (array_key_exists('admin_lapangan_ids', $data)) {
                $rawIds = is_array($data['admin_lapangan_ids']) ? $data['admin_lapangan_ids'] : [];
                $validIds = User::whereIn('id_pengguna', $rawIds)
                    ->where('peran', 'AdminLapangan')
                    ->pluck('id_pengguna')
                    ->all();
                $proyek->adminLapanganAkses()->sync($validIds);
            }

            return $proyek->fresh(['rab', 'termin' => fn ($q) => $q->orderBy('nomor_termin'), 'adminLapanganAkses:id_pengguna,nama,email'])
                ?? $proyek;
        });
    }

    /**
     * Menghapus proyek beserta seluruh data turunan dan file digital terkait (DIR-03).
     */
    public function deleteProject(Proyek $proyek): void
    {
        $progresIds = ProgresFisik::where('id_proyek', $proyek->id_proyek)->pluck('id_progres')->all();
        $terminIds = Termin::where('id_proyek', $proyek->id_proyek)->pluck('id_termin')->all();

        $filesToDelete = array_filter(array_merge(
            ArsipDokumen::where('id_proyek', $proyek->id_proyek)->pluck('path_digital')->all(),
            ProgresFisik::where('id_proyek', $proyek->id_proyek)->pluck('path_foto')->all(),
            empty($progresIds) ? [] : KendalaLapangan::whereIn('id_progres', $progresIds)->pluck('path_foto')->all(),
            empty($terminIds) ? [] : DokumenTermin::whereIn('id_termin', $terminIds)->pluck('path_file')->all(),
        ));

        DB::transaction(function () use ($proyek, $progresIds, $terminIds) {
            TransaksiPembelian::where('id_proyek', $proyek->id_proyek)->delete();
            RequestMaterial::where('id_proyek', $proyek->id_proyek)->delete();
            FasilitasKredit::where('id_proyek', $proyek->id_proyek)->delete();

            if (! empty($progresIds)) {
                KendalaLapangan::whereIn('id_progres', $progresIds)->delete();
            }
            ProgresFisik::where('id_proyek', $proyek->id_proyek)->delete();

            if (! empty($terminIds)) {
                DokumenTermin::whereIn('id_termin', $terminIds)->delete();
            }
            Termin::where('id_proyek', $proyek->id_proyek)->delete();

            ArsipDokumen::where('id_proyek', $proyek->id_proyek)->delete();
            $proyek->rab()->delete();
            $proyek->adminLapanganAkses()->detach();
            $proyek->delete();
        });

        foreach ($filesToDelete as $path) {
            if (is_string($path) && $path !== '' && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * Mengambil katalog daftar proyek dengan filter pencarian, akses proyek, dan ringkasan operasional.
     *
     * @param  list<int>|null  $allowedProjectIds
     * @return Collection<int, mixed>
     */
    public function getProjectList(
        ?string $keyword = null,
        ?string $statusProyek = null,
        ?array $allowedProjectIds = null
    ): Collection {
        if ($allowedProjectIds !== null && empty($allowedProjectIds)) {
            return collect();
        }

        $query = Proyek::with([
            'rab',
            'adminLapanganAkses:id_pengguna,nama,email',
            'termin' => fn ($q) => $q->orderBy('nomor_termin', 'asc'),
            'progresFisik' => fn ($q) => $q->latest('tanggal_lapor')->latest('id_progres'),
        ]);

        if ($allowedProjectIds !== null) {
            $query->whereIn('id_proyek', $allowedProjectIds);
        }

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
        $result = $projects->map(function ($proyek) use ($allowedProjectIds) {
            /** @var Proyek $proyek */
            /** @var Termin|null $terminBerjalan */
            $terminBerjalan = $proyek->termin->firstWhere('status_penagihan', '!=', 'SP2D cair')
                ?? $proyek->termin->last();

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

            $payload = [
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
                'admin_lapangan_ids' => $proyek->adminLapanganAkses
                    ->pluck('id_pengguna')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all(),
                'admin_lapangan' => $proyek->adminLapanganAkses->values()->all(),
                'created_at' => $proyek->created_at?->toDateTimeString(),
            ];

            // Admin Lapangan tidak membutuhkan & tidak melihat nilai pagu/kontrak/tagihan finansial
            if ($allowedProjectIds !== null) {
                $payload['nilai_kontrak'] = 0.0;
                $payload['ringkasan_rab'] = [
                    'total_pagu' => 0.0,
                    'sisa_pagu' => 0.0,
                    'versi_rab' => $versiRab,
                ];
                if ($payload['posisi_termin_berjalan'] !== null) {
                    $payload['posisi_termin_berjalan']['nilai_tagihan'] = 0.0;
                }
            }

            return $payload;
        });

        return $result;
    }

    /**
     * Mengambil detail lengkap satu proyek (getDetailProyek, getRekapProgres, getStatusTermin).
     *
     * @return array<string, mixed>|null
     */
    public function getProjectDetail(int $idProyek, bool $hideFinancials = false): ?array
    {
        $proyek = Proyek::with([
            'pembuat',
            'rab',
            'adminLapanganAkses:id_pengguna,nama,email',
            'termin' => fn ($q) => $q->orderBy('nomor_termin', 'asc')->with('dokumenTermin'),
            'progresFisik' => fn ($q) => $q->latest('tanggal_lapor')->latest('id_progres')->with(['pelapor', 'kendalaLapangan']),
        ])->find($idProyek);

        if (! $proyek) {
            return null;
        }

        $progresTerakhir = $proyek->progresFisik->first();
        $persentaseProgres = $progresTerakhir ? (float) $progresTerakhir->persentase_realisasi : 0.0;

        $totalTermin = $proyek->termin->count();
        $terminCair = $proyek->termin->where('status_penagihan', 'SP2D cair')->count();
        $totalTagihanCair = (float) $proyek->termin->where('status_penagihan', 'SP2D cair')->sum('nilai_tagihan');
        $sisaTagihan = (float) $proyek->nilai_kontrak - $totalTagihanCair;

        if ($hideFinancials) {
            $proyek->makeHidden(['rab']);
        }

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
                'total_tagihan_cair' => $hideFinancials ? 0.0 : $totalTagihanCair,
                'sisa_tagihan' => $hideFinancials ? 0.0 : $sisaTagihan,
            ],
        ];
    }
}
