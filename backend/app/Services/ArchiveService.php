<?php

namespace App\Services;

use App\Models\ArsipDokumen;
use App\Models\RequestMaterial;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

            // Simpan file jika ada upload dokumen
            $pathDigital = null;
            if ($file) {
                $pathDigital = $file->store('arsip', 'public');
            } elseif (! empty($data['path_digital'])) {
                $pathDigital = $data['path_digital'];
            }

            // 1. Simpan metadata arsip
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

            // 2. Simpan koordinat lokasi fisik jika Fisik atau Hibrida
            $lokasiFisik = null;
            if (in_array($tipe, ['Fisik', 'Hibrida'], true)) {
                $lokasiFisik = $arsip->lokasiArsipFisik()->create([
                    'nomor_binder' => $data['nomor_binder'],
                    'nomor_rak' => $data['nomor_rak'],
                    'ruang_simpan' => $data['ruang_simpan'],
                    'keterangan_posisi' => $data['keterangan_posisi'] ?? null,
                ]);
            }

            // 3. Sambungkan referensi silang transaksi material jika id_request disertakan
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
     * Pencarian multi-kriteria repositori arsip (UC-02 & SD-07).
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, ArsipDokumen>
     */
    public function searchArchives(array $filters): Collection
    {
        $query = ArsipDokumen::with(['lokasiArsipFisik', 'proyek', 'pencatat']);

        // Kata kunci pencarian global
        if (! empty($filters['q'])) {
            $q = $filters['q'];
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

        // Filter jenis arsip
        if (! empty($filters['jenis_arsip'])) {
            $query->where('jenis_arsip', $filters['jenis_arsip']);
        }

        // Filter tipe penyimpanan
        if (! empty($filters['tipe_penyimpanan'])) {
            $query->where('tipe_penyimpanan', $filters['tipe_penyimpanan']);
        }

        // Filter proyek
        if (! empty($filters['id_proyek'])) {
            $query->where('id_proyek', $filters['id_proyek']);
        }

        // Filter koordinat fisik
        if (! empty($filters['ruang_simpan']) || ! empty($filters['nomor_rak']) || ! empty($filters['nomor_binder'])) {
            $query->whereHas('lokasiArsipFisik', function ($loc) use ($filters) {
                if (! empty($filters['ruang_simpan'])) {
                    $loc->where('ruang_simpan', 'like', "%{$filters['ruang_simpan']}%");
                }
                if (! empty($filters['nomor_rak'])) {
                    $loc->where('nomor_rak', 'like', "%{$filters['nomor_rak']}%");
                }
                if (! empty($filters['nomor_binder'])) {
                    $loc->where('nomor_binder', 'like', "%{$filters['nomor_binder']}%");
                }
            });
        }

        // Filter rentang tanggal arsip
        if (! empty($filters['tanggal_awal'])) {
            $query->where('tanggal_arsip', '>=', $filters['tanggal_awal']);
        }
        if (! empty($filters['tanggal_akhir'])) {
            $query->where('tanggal_arsip', '<=', $filters['tanggal_akhir']);
        }
        if (! empty($filters['tanggal_arsip'])) {
            $query->where('tanggal_arsip', $filters['tanggal_arsip']);
        }

        return $query->latest('id_arsip')->get();
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
