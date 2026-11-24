<?php

namespace App\Services;

use App\Models\ArsipDokumen;
use App\Models\RequestMaterial;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ArchiveService
{
    /**
     * Generate kode arsip unik jika belum diisi.
     */
    public function generateKodeArsip(string $tipePenyimpanan, string $tanggal): string
    {
        $prefixType = match ($tipePenyimpanan) {
            'Fisik' => 'FSK',
            'Digital' => 'DGT',
            'Hibrida' => 'HBR',
            default => 'ARS',
        };

        $cleanDate = str_replace('-', '', substr($tanggal, 0, 10));
        $prefix = "ARS-{$prefixType}-{$cleanDate}";

        $lastRecord = ArsipDokumen::where('kode_arsip', 'like', "{$prefix}-%")
            ->orderBy('id_arsip', 'desc')
            ->first();

        if (! $lastRecord) {
            return "{$prefix}-001";
        }

        $parts = explode('-', $lastRecord->kode_arsip);
        $lastSeq = (int) end($parts);
        $nextSeq = $lastSeq + 1;

        return sprintf('%s-%03d', $prefix, $nextSeq);
    }

    /**
     * Menyimpan arsip dokumen baru beserta lokasi fisik dan file digital (UC-11).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function createArchive(array $data, int $pencatatId, ?UploadedFile $file = null): array
    {
        return DB::transaction(function () use ($data, $pencatatId, $file) {
            $tanggal = $data['tanggal_arsip'];
            $tipe = $data['tipe_penyimpanan'];

            $kodeArsip = ! empty($data['kode_arsip'])
                ? $data['kode_arsip']
                : $this->generateKodeArsip($tipe, $tanggal);

            $pathDigital = null;
            if ($file) {
                $pathDigital = $file->store('arsip', 'public');
            } elseif (! empty($data['path_digital'])) {
                $pathDigital = $data['path_digital'];
            }

            $arsip = ArsipDokumen::create([
                'id_proyek' => $data['id_proyek'],
                'id_pencatat' => $pencatatId,
                'nomor_surat' => $data['nomor_surat'],
                'jenis_transaksi' => $data['jenis_transaksi'],
                'pihak_penyedia' => $data['pihak_penyedia'],
                'kode_arsip' => $kodeArsip,
                'judul_dokumen' => $data['judul_dokumen'],
                'jenis_arsip' => $data['jenis_arsip'],
                'tanggal_arsip' => $tanggal,
                'tipe_penyimpanan' => $tipe,
                'path_digital' => $pathDigital,
            ]);

            $lokasiFisik = null;
            if (in_array($tipe, ['Fisik', 'Hibrida'], true)) {
                $lokasiFisik = $arsip->lokasiArsipFisik()->create([
                    'nomor_binder' => $data['nomor_binder'],
                    'nomor_rak' => $data['nomor_rak'],
                    'ruang_simpan' => $data['ruang_simpan'],
                    'keterangan_posisi' => $data['keterangan_posisi'] ?? null,
                ]);
            }

            if (! empty($data['id_request'])) {
                RequestMaterial::where('id_request', $data['id_request'])
                    ->update(['id_arsip_ref' => $arsip->id_arsip]);
            }

            $labelStiker = 'LABEL-'.$kodeArsip;
            $koordinatLabel = $lokasiFisik
                ? "{$lokasiFisik->ruang_simpan}/{$lokasiFisik->nomor_rak}/{$lokasiFisik->nomor_binder}"
                : 'DIGITAL-ONLY';

            return [
                'arsip' => $arsip->load(['lokasiArsipFisik', 'proyek', 'pencatat']),
                'label_stiker' => $labelStiker,
                'koordinat_label' => $koordinatLabel,
            ];
        });
    }

    /**
     * Pencarian multi-kriteria repositori arsip dengan pengurutan & pagination (ARS-04, ARS-05, ARS-06, GLB-14).
     *
     * @param  array<string, mixed>  $filters
     * @param  list<int>|null  $allowedProjectIds
     * @return array{items: array<int, mixed>, meta: array<string, mixed>}
     */
    public function searchArchives(array $filters, ?array $allowedProjectIds = null): array
    {
        if ($allowedProjectIds !== null && empty($allowedProjectIds)) {
            return [
                'items' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                ],
            ];
        }

        $query = ArsipDokumen::with(['lokasiArsipFisik', 'proyek', 'pencatat']);

        if ($allowedProjectIds !== null) {
            $query->whereIn('id_proyek', $allowedProjectIds);
        }

        if (! empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            $query->where(function ($sub) use ($q) {
                $sub->where('kode_arsip', 'like', "%{$q}%")
                    ->orWhere('judul_dokumen', 'like', "%{$q}%")
                    ->orWhere('nomor_surat', 'like', "%{$q}%")
                    ->orWhere('pihak_penyedia', 'like', "%{$q}%")
                    ->orWhereHas('proyek', function ($p) use ($q) {
                        $p->where('nama_proyek', 'like', "%{$q}%")
                            ->orWhere('kode_proyek', 'like', "%{$q}%");
                    });
            });
        }

        if (! empty($filters['jenis_arsip'])) {
            $query->where('jenis_arsip', $filters['jenis_arsip']);
        }

        if (! empty($filters['tipe_penyimpanan'])) {
            $query->where('tipe_penyimpanan', $filters['tipe_penyimpanan']);
        }

        if (! empty($filters['id_proyek'])) {
            $query->where('id_proyek', (int) $filters['id_proyek']);
        }

        // Filter lokasi fisik fleksibel (ruang simpan / rak / binder / keterangan posisi - ARS-06)
        $lokasiFilter = trim((string) ($filters['lokasi_fisik'] ?? $filters['ruang_simpan'] ?? ''));
        $rakFilter = trim((string) ($filters['nomor_rak'] ?? ''));
        $binderFilter = trim((string) ($filters['nomor_binder'] ?? ''));

        if ($lokasiFilter !== '' || $rakFilter !== '' || $binderFilter !== '') {
            $query->whereHas('lokasiArsipFisik', function ($loc) use ($lokasiFilter, $rakFilter, $binderFilter) {
                if ($lokasiFilter !== '') {
                    $loc->where(function ($inner) use ($lokasiFilter) {
                        $inner->where('ruang_simpan', 'like', "%{$lokasiFilter}%")
                            ->orWhere('nomor_rak', 'like', "%{$lokasiFilter}%")
                            ->orWhere('nomor_binder', 'like', "%{$lokasiFilter}%")
                            ->orWhere('keterangan_posisi', 'like', "%{$lokasiFilter}%");
                    });
                }
                if ($rakFilter !== '') {
                    $loc->where('nomor_rak', 'like', "%{$rakFilter}%");
                }
                if ($binderFilter !== '') {
                    $loc->where('nomor_binder', 'like', "%{$binderFilter}%");
                }
            });
        }

        // Urutan Terbaru / Terlama (ARS-05)
        $sort = strtolower((string) ($filters['sort'] ?? 'terbaru'));
        if ($sort === 'terlama') {
            $query->orderBy('tanggal_arsip', 'asc')->orderBy('id_arsip', 'asc');
        } else {
            $query->orderBy('tanggal_arsip', 'desc')->orderBy('id_arsip', 'desc');
        }

        // Pagination (ARS-04): default 10, dukung 10 / 25 / 50 / all
        $perPageRaw = strtolower((string) ($filters['per_page'] ?? '10'));
        if (in_array($perPageRaw, ['all', 'semua', '0', '-1'], true)) {
            $all = $query->get();

            return [
                'items' => $all->values()->all(),
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 'all',
                    'total' => $all->count(),
                ],
            ];
        }

        $perPage = (int) $perPageRaw;
        if ($perPage < 1 || $perPage > 200) {
            $perPage = 10;
        }

        $paginator = $query->paginate($perPage);

        return [
            'items' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * Mengambil detail arsip lengkap beserta relasi dan URL pratinjau digital.
     */
    public function getArchiveDetail(int $idArsip): ?ArsipDokumen
    {
        return ArsipDokumen::with([
            'lokasiArsipFisik',
            'proyek',
            'pencatat',
            'requestMaterial',
        ])->find($idArsip);
    }

    /**
     * Memperbarui koordinat posisi arsip fisik dan metadata arsip.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>|null
     */
    public function updateArchiveLocation(int $idArsip, array $data): ?array
    {
        $arsip = ArsipDokumen::with('lokasiArsipFisik')->find($idArsip);

        if (! $arsip) {
            return null;
        }

        return DB::transaction(function () use ($arsip, $data) {
            $metaFields = array_intersect_key($data, array_flip([
                'nomor_surat',
                'jenis_transaksi',
                'pihak_penyedia',
                'judul_dokumen',
                'jenis_arsip',
                'tanggal_arsip',
                'tipe_penyimpanan',
            ]));

            if (! empty($metaFields)) {
                $arsip->update($metaFields);
            }

            $tipeBaru = $arsip->tipe_penyimpanan;
            $hasLocationPayload = array_key_exists('nomor_binder', $data)
                || array_key_exists('nomor_rak', $data)
                || array_key_exists('ruang_simpan', $data)
                || array_key_exists('keterangan_posisi', $data);

            if (in_array($tipeBaru, ['Fisik', 'Hibrida'], true)) {
                $existing = $arsip->lokasiArsipFisik;
                $nomorBinder = $data['nomor_binder'] ?? $existing?->nomor_binder;
                $nomorRak = $data['nomor_rak'] ?? $existing?->nomor_rak;
                $ruangSimpan = $data['ruang_simpan'] ?? $existing?->ruang_simpan;

                if ($hasLocationPayload || ! $existing) {
                    if (empty($nomorBinder) || empty($nomorRak) || empty($ruangSimpan)) {
                        throw ValidationException::withMessages([
                            'lokasi_arsip' => 'Nomor binder, nomor rak, dan ruang simpan wajib diisi untuk arsip Fisik atau Hibrida.',
                        ]);
                    }

                    $arsip->lokasiArsipFisik()->updateOrCreate(
                        ['id_arsip' => $arsip->id_arsip],
                        [
                            'nomor_binder' => $nomorBinder,
                            'nomor_rak' => $nomorRak,
                            'ruang_simpan' => $ruangSimpan,
                            'keterangan_posisi' => array_key_exists('keterangan_posisi', $data)
                                ? $data['keterangan_posisi']
                                : $existing?->keterangan_posisi,
                        ]
                    );
                }
            }

            $arsip = $arsip->fresh(['lokasiArsipFisik', 'proyek', 'pencatat']);
            $lokasi = $arsip?->lokasiArsipFisik;

            return [
                'arsip' => $arsip,
                'koordinat_label' => $lokasi
                    ? "{$lokasi->ruang_simpan}/{$lokasi->nomor_rak}/{$lokasi->nomor_binder}"
                    : 'DIGITAL-ONLY',
            ];
        });
    }

    /**
     * Menghapus dokumen arsip fisik/digital dari repositori.
     */
    public function deleteArchive(int $idArsip): bool
    {
        $arsip = ArsipDokumen::find($idArsip);

        if (! $arsip) {
            return false;
        }

        if ($arsip->path_digital && Storage::disk('public')->exists($arsip->path_digital)) {
            Storage::disk('public')->delete($arsip->path_digital);
        }

        return (bool) $arsip->delete();
    }
}
