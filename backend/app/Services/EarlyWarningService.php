<?php

namespace App\Services;

use App\Models\KendalaLapangan;
use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Models\Termin;
use App\Support\Tanggal;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

// Tempat untuk menghitung seluruh parameter untuk dikirim ke LLM atau dashboard
// 1.  Termin berjalan: termin dengan nomor_termin terkecil yang statusnya bukan Diajukan ke Dinas dan bukan SP2D cair.
// 2.  Target ekspektasi (kurva S): interpolasi linear dari titik awal ke tenggat. Titik awal = tenggat termin sebelumnya (atau tanggal_mulai untuk termin 1), dengan persentase awal = target termin sebelumnya (atau 0).
// 3.  deviasi_poin = realisasi - target ekspektasi (negatif berarti tertinggal).
// 4.  laju (poin/hari) dari maksimal 3 laporan terakhir; bila belum ada, dipakai laju rencana.
// 5.  hari_terlambat_progres = max(0, ceil(sisa_ke_target / laju) - hari_ke_tenggat).
// 6.  estimasi_hari_terlambat = hari_terlambat_progres + jumlah estimasi_hari_tertunda kendala yang masih Aktif.
// 7.  estimasi_kerugian = nilai_tagihan x tarif x estimasi_hari_terlambat.
// 8.  Status: Waspada bila tertinggal > 2 poin, atau ada kendala Berat aktif, atau skor kendala >= 3, atau ada hari terlambat. Kritis bila tenggat lewat dan target belum tercapai, atau tertinggal >= 10 poin, atau skor kendala >= 6. Selain itu Aman.

class EarlyWarningService
{
    public const STATUS_AMAN = 'Aman';

    public const STATUS_WASPADA = 'Waspada';

    public const STATUS_KRITIS = 'Kritis';

    public function __construct(
        protected RekomendasiService $rekomendasiService
    ) {}

    public function analyze(Proyek $proyek, ?CarbonInterface $today = null): array
    {
        $payload = $this->evaluate($proyek, $today);
        $payload['rekomendasi'] = $this->rekomendasiService->generate($payload);

        return $payload;
    }

    public function refresh(Proyek $proyek, ?CarbonInterface $today = null): array
    {
        $payload = $this->evaluate($proyek, $today);

        if ($payload['termin_berjalan'] !== null) {
            Termin::whereKey($payload['termin_berjalan']['id_termin'])
                ->update(['estimasi_kerugian' => $payload['prediksi']['estimasi_kerugian']]);
        }

        return $payload;
    }

    public function evaluate(Proyek $proyek, ?CarbonInterface $today = null): array
    {
        $today = Carbon::instance($today ?? now())->startOfDay();

        // Query segar (bukan relasi ter-cache) agar hasil selalu terbaru setelah penulisan.
        $termins = Termin::where('id_proyek', $proyek->id_proyek)->orderBy('nomor_termin')->get();
        $laporan = ProgresFisik::where('id_proyek', $proyek->id_proyek)
            ->orderBy('tanggal_lapor')
            ->orderBy('id_progres')
            ->get();
        $kendalaAktif = KendalaLapangan::whereIn(
            'id_progres',
            ProgresFisik::where('id_proyek', $proyek->id_proyek)->select('id_progres')
        )
            ->where('status_penanganan', KendalaLapangan::STATUS_AKTIF)
            ->orderBy('id_kendala')
            ->get();

        // Termin berjalan = termin terdepan yang masih bergantung pada kerja lapangan.
        // Termin 'Diajukan ke Dinas' / 'SP2D cair' sudah lepas dari risiko keterlambatan lapangan.
        $terminBerjalan = $termins->first(fn (Termin $t) => ! in_array(
            $t->status_penagihan,
            [Termin::STATUS_DIAJUKAN, Termin::STATUS_SP2D_CAIR],
            true
        ));
        $laporanTerakhir = $laporan->last();
        $realisasi = $laporanTerakhir ? (float) $laporanTerakhir->persentase_realisasi : 0.0;

        $skorKendala = $this->hitungSkorKendala($kendalaAktif);
        $hariKendala = (int) $kendalaAktif->sum('estimasi_hari_tertunda');

        $payload = [
            'id_proyek' => $proyek->id_proyek,
            'kode_proyek' => $proyek->kode_proyek,
            'nama_proyek' => $proyek->nama_proyek,
            'tanggal_evaluasi' => $today->toDateString(),
            'status' => self::STATUS_AMAN,
            'termin_berjalan' => null,
            'progres' => [
                'realisasi_terakhir' => $realisasi,
                'tanggal_lapor_terakhir' => Tanggal::format($laporanTerakhir?->tanggal_lapor),
                'target_ekspektasi' => null,
                'deviasi_poin' => null,
                'gap_ke_target_termin' => null,
                'laju_per_hari' => null,
            ],
            'prediksi' => [
                'hari_terlambat_progres' => 0,
                'hari_terlambat_kendala' => $hariKendala,
                'estimasi_hari_terlambat' => 0,
                'estimasi_kerugian' => 0.0,
            ],
            'skor_kendala' => $skorKendala,
            'kendala_aktif' => $kendalaAktif->map(fn (KendalaLapangan $k) => [
                'id_kendala' => $k->id_kendala,
                'kategori_kendala' => $k->kategori_kendala,
                'tingkat_keparahan' => $k->tingkat_keparahan,
                'deskripsi_kendala' => $k->deskripsi_kendala,
                'estimasi_hari_tertunda' => (int) $k->estimasi_hari_tertunda,
                'tanggal_kejadian' => Tanggal::format($k->tanggal_kejadian),
            ])->values()->all(),
            'faktor_penyebab' => [],
            'kurva_s' => ['target' => [], 'realisasi' => $this->kurvaRealisasi($laporan)],
        ];

        // Tidak ada termin yang masih bergantung pada kerja lapangan: tidak ada risiko tersisa.
        if (! $terminBerjalan) {
            return $payload;
        }

        $target = (float) $terminBerjalan->target_persentase;
        $tenggat = Tanggal::carbon($terminBerjalan->tenggat_waktu)->startOfDay();
        $hariKeTenggat = $this->selisihHari($today, $tenggat);

        // --- Target kurva S (interpolasi linear antara termin sebelumnya dan termin ini) ---
        $sebelumnya = $termins->last(fn (Termin $t) => $t->nomor_termin < $terminBerjalan->nomor_termin);
        $tanggalAwal = $sebelumnya
            ? Tanggal::carbon($sebelumnya->tenggat_waktu)->startOfDay()
            : Tanggal::carbon($proyek->tanggal_mulai)->startOfDay();
        $targetAwal = $sebelumnya ? min((float) $sebelumnya->target_persentase, $target) : 0.0;

        $totalHari = max(1, $this->selisihHari($tanggalAwal, $tenggat));
        $berjalanHari = min(max($this->selisihHari($tanggalAwal, $today), 0), $totalHari);
        $targetEkspektasi = $targetAwal + ($target - $targetAwal) * $berjalanHari / $totalHari;

        $deviasi = round($realisasi - $targetEkspektasi, 2);   // negatif = tertinggal
        $ketertinggalan = max(0.0, -$deviasi);
        $sisaKeTarget = max(0.0, $target - $realisasi);

        // --- Laju progres (poin/hari) dari laporan terakhir, fallback ke laju rencana ---
        $laju = $this->hitungLaju($laporan);
        $lajuRencana = ($target - $targetAwal) / $totalHari;
        $lajuPakai = ($laju !== null && $laju > 0) ? $laju : $lajuRencana;

        // --- Estimasi hari terlambat ---
        $hariTerlambatProgres = 0;
        if ($sisaKeTarget > 0) {
            if ($lajuPakai > 0) {
                $hariButuh = (int) ceil($sisaKeTarget / $lajuPakai);
                $hariTerlambatProgres = max(0, $hariButuh - $hariKeTenggat);
            } else {
                $hariTerlambatProgres = max(0, -$hariKeTenggat);
            }
        }
        $estimasiHariTerlambat = $hariTerlambatProgres + $hariKendala;
        $estimasiKerugian = round(
            $this->kerugianPerHari($terminBerjalan) * $estimasiHariTerlambat,
            2
        );

        // --- Status early warning ---
        $adaKendalaBerat = $kendalaAktif->contains(fn (KendalaLapangan $k) => $k->tingkat_keparahan === 'Berat');
        $cfg = config('pantera.early_warning');

        $status = self::STATUS_AMAN;
        if (
            $ketertinggalan > $cfg['toleransi_deviasi']
            || $adaKendalaBerat
            || $skorKendala >= $cfg['ambang_skor_waspada']
            || $estimasiHariTerlambat > 0
        ) {
            $status = self::STATUS_WASPADA;
        }
        if (
            ($hariKeTenggat < 0 && $sisaKeTarget > 0)
            || $ketertinggalan >= $cfg['ambang_kritis_deviasi']
            || $skorKendala >= $cfg['ambang_skor_kritis']
        ) {
            $status = self::STATUS_KRITIS;
        }

        $payload['status'] = $status;
        $payload['termin_berjalan'] = [
            'id_termin' => $terminBerjalan->id_termin,
            'nomor_termin' => $terminBerjalan->nomor_termin,
            'target_persentase' => $target,
            'nilai_tagihan' => (float) $terminBerjalan->nilai_tagihan,
            'tenggat_waktu' => $tenggat->toDateString(),
            'status_penagihan' => $terminBerjalan->status_penagihan,
            'hari_ke_tenggat' => $hariKeTenggat,
        ];
        $payload['progres']['target_ekspektasi'] = round($targetEkspektasi, 2);
        $payload['progres']['deviasi_poin'] = $deviasi;
        $payload['progres']['gap_ke_target_termin'] = round($realisasi - $target, 2);
        $payload['progres']['laju_per_hari'] = $laju !== null ? round($laju, 4) : null;
        $payload['prediksi'] = [
            'hari_terlambat_progres' => $hariTerlambatProgres,
            'hari_terlambat_kendala' => $hariKendala,
            'estimasi_hari_terlambat' => $estimasiHariTerlambat,
            'estimasi_kerugian' => $estimasiKerugian,
        ];
        $payload['faktor_penyebab'] = $this->faktorPenyebab(
            $ketertinggalan, $hariKeTenggat, $sisaKeTarget, $kendalaAktif
        );
        $payload['kurva_s']['target'] = [
            ['tanggal' => $tanggalAwal->toDateString(), 'persentase' => round($targetAwal, 2)],
            ['tanggal' => $tenggat->toDateString(), 'persentase' => round($target, 2)],
        ];

        return $payload;
    }

    public function portfolio(?CarbonInterface $today = null): array
    {
        $items = Proyek::where('status_proyek', 'Aktif')
            ->orderBy('id_proyek')
            ->get()
            ->map(function (Proyek $proyek) use ($today) {
                $ew = $this->evaluate($proyek, $today);

                return [
                    'id_proyek' => $proyek->id_proyek,
                    'kode_proyek' => $proyek->kode_proyek,
                    'nama_proyek' => $proyek->nama_proyek,
                    'status' => $ew['status'],
                    'termin_berjalan' => $ew['termin_berjalan'],
                    'realisasi_terakhir' => $ew['progres']['realisasi_terakhir'],
                    'deviasi_poin' => $ew['progres']['deviasi_poin'],
                    'estimasi_hari_terlambat' => $ew['prediksi']['estimasi_hari_terlambat'],
                    'estimasi_kerugian' => $ew['prediksi']['estimasi_kerugian'],
                ];
            });

        return [
            'ringkasan' => [
                'total_proyek' => $items->count(),
                'proyek_berisiko' => $items->where('status', '!=', self::STATUS_AMAN)->count(),
                'total_estimasi_kerugian' => round((float) $items->sum('estimasi_kerugian'), 2),
            ],
            'proyek' => $items->values()->all(),
        ];
    }

    /**
     * Kerugian per hari keterlambatan satu termin (nilai tagihan x tarif).
     */
    public function kerugianPerHari(Termin $termin): float
    {
        return (float) $termin->nilai_tagihan * (float) config('pantera.early_warning.tarif_kerugian_per_hari');
    }

    /**
     * Selisih hari bertanda dari $dari ke $ke (negatif jika $ke sebelum $dari).
     */
    public function selisihHari(CarbonInterface $dari, CarbonInterface $ke): int
    {
        return (int) round(
            $dari->copy()->startOfDay()->diffInDays($ke->copy()->startOfDay(), false)
        );
    }

    /**
     * @param  Collection<int, KendalaLapangan>  $kendalaAktif
     */
    protected function hitungSkorKendala(Collection $kendalaAktif): int
    {
        $bobot = config('pantera.kendala.keparahan');

        return (int) $kendalaAktif->sum(fn (KendalaLapangan $k) => $bobot[$k->tingkat_keparahan] ?? 1);
    }

    protected function hitungLaju(Collection $laporan): ?float
    {
        $jendela = $laporan->slice(-1 * (int) config('pantera.early_warning.jendela_laju_laporan'))->values();

        if ($jendela->count() < 2) {
            return null;
        }

        $awal = $jendela->first();
        $akhir = $jendela->last();
        $hari = $this->selisihHari(
            Tanggal::carbon($awal->tanggal_lapor),
            Tanggal::carbon($akhir->tanggal_lapor)
        );

        if ($hari <= 0) {
            return null;
        }

        return ((float) $akhir->persentase_realisasi - (float) $awal->persentase_realisasi) / $hari;
    }

    /**
     * @param  Collection<int, ProgresFisik>  $laporan
     * @return array<int, array{tanggal: string|null, persentase: float}>
     */
    protected function kurvaRealisasi(Collection $laporan): array
    {
        return $laporan->map(fn (ProgresFisik $p) => [
            'tanggal' => Tanggal::format($p->tanggal_lapor),
            'persentase' => (float) $p->persentase_realisasi,
        ])->values()->all();
    }

    /**
     * @param  Collection<int, KendalaLapangan>  $kendalaAktif
     * @return array<int, string>
     */
    protected function faktorPenyebab(
        float $ketertinggalan,
        int $hariKeTenggat,
        float $sisaKeTarget,
        Collection $kendalaAktif
    ): array {
        $faktor = [];

        if ($ketertinggalan > (float) config('pantera.early_warning.toleransi_deviasi')) {
            $faktor[] = 'Progres tertinggal '.round($ketertinggalan, 2).' poin dari target kurva S.';
        }
        if ($hariKeTenggat < 0 && $sisaKeTarget > 0) {
            $faktor[] = 'Tenggat termin sudah terlewat '.abs($hariKeTenggat).' hari dan target belum tercapai.';
        }
        foreach ($kendalaAktif->groupBy('kategori_kendala') as $kategori => $daftar) {
            $faktor[] = 'Kendala '.$kategori.' aktif ('.$daftar->count().' kejadian, '
                .(int) $daftar->sum('estimasi_hari_tertunda').' hari tertunda).';
        }

        return $faktor;
    }
}
