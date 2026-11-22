<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class RekomendasiService
{
    private const SARAN_KATEGORI = [
        'Cuaca' => 'Siapkan rencana cadangan dan tambahan jam kerja atau shift saat cuaca membaik untuk mengejar target termin.',
        'Material' => 'Percepat pengadaan material melalui Request Material dan koordinasikan jadwal pengiriman dengan vendor.',
        'Tenaga Kerja' => 'Tambah tenaga kerja atau atur ulang shift pada pekerjaan yang menjadi jalur kritis.',
        'Peralatan' => 'Segera perbaiki atau sewa pengganti peralatan yang bermasalah agar pekerjaan tidak tertahan.',
        'Teknis' => 'Koordinasikan solusi teknis dengan konsultan pengawas agar pekerjaan dapat dilanjutkan.',
    ];

    public function generate(array $payload): array
    {
        $driver = config('pantera.early_warning.driver');
        $apiKey = config('pantera.llm.api_key');

        if ($driver === 'llm' && filled($apiKey) && $payload['termin_berjalan'] !== null) {
            try {
                return ['teks' => $this->viaLlm($payload), 'sumber' => 'llm'];
            } catch (Throwable $e) {
                Log::warning('Rekomendasi LLM gagal, memakai aturan: '.$e->getMessage());
            }
        }

        return ['teks' => $this->viaAturan($payload), 'sumber' => 'rule'];
    }

    public function viaAturan(array $payload): string
    {
        if ($payload['termin_berjalan'] === null) {
            return 'Seluruh termin telah dicairkan. Tidak ada risiko penagihan yang tersisa.';
        }

        if ($payload['status'] === EarlyWarningService::STATUS_AMAN) {
            return 'Progres sesuai target kurva S termin. Pertahankan ritme kerja dan lengkapi berkas termin sejak dini.';
        }

        $bagian = [];

        $hari = $payload['prediksi']['estimasi_hari_terlambat'];
        if ($hari > 0) {
            $kerugian = number_format($payload['prediksi']['estimasi_kerugian'], 0, ',', '.');
            $bagian[] = "Penagihan termin diperkirakan mundur {$hari} hari dengan potensi kerugian Rp {$kerugian}.";
        }

        $bagian[] = $this->saranKendalaDominan($payload['kendala_aktif'])
            ?? 'Percepat pekerjaan fisik agar target termin tercapai sebelum tenggat.';

        $bagian[] = $payload['status'] === EarlyWarningService::STATUS_KRITIS
            ? 'Siapkan koordinasi tambahan modal kerja dengan bank dan percepat kelengkapan berkas termin.'
            : 'Pantau arus kas dan siapkan dokumen termin lebih awal.';

        return implode(' ', $bagian);
    }

    protected function viaLlm(array $payload): string
    {
        $dikirim = $this->payloadUntukLlm($payload);

        return Cache::remember(
            'ew:rekomendasi:'.md5(json_encode([config('pantera.llm.model'), $dikirim])),
            (int) config('pantera.llm.cache_detik'),
            function () use ($dikirim) {
                $body = [
                    'model' => config('pantera.llm.model'),
                    'temperature' => 0.3,
                    'max_completion_tokens' => (int) config('pantera.llm.max_completion_tokens'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Anda adalah analis keuangan proyek konstruksi yang andal dan profesional. Berdasarkan data JSON, tuliskan rekomendasi '
                                .'mitigasi keterlambatan termin dalam Bahasa Indonesia, maksimal 3 kalimat. '
                                .'Jangan mengubah atau mengarang angka; gunakan angka dari data apa adanya.',
                        ],
                        ['role' => 'user', 'content' => json_encode($dikirim, JSON_UNESCAPED_UNICODE)],
                    ],
                ];

                if (filled(config('pantera.llm.reasoning_effort'))) {
                    $body['reasoning_effort'] = config('pantera.llm.reasoning_effort');
                    $body['include_reasoning'] = false;
                }

                $response = Http::withToken((string) config('pantera.llm.api_key'))
                    ->acceptJson()
                    ->timeout((int) config('pantera.llm.timeout'))
                    ->post(config('pantera.llm.endpoint'), $body)
                    ->throw();
                $teks = trim((string) $response->json('choices.0.message.content'));

                if ($teks === '') {
                    throw new RuntimeException('Respon LLM kosong.');
                }

                return $teks;

            }
        );
    }

    protected function payloadUntukLlm(array $payload): array
    {
        return [
            'status' => $payload['status'],
            'termin_berjalan' => [
                'nomor_termin' => $payload['termin_berjalan']['nomor_termin'],
                'target_persentase' => $payload['termin_berjalan']['target_persentase'],
                'hari_ke_tenggat' => $payload['termin_berjalan']['hari_ke_tenggat'],
            ],
            'progres' => $payload['progres'],
            'prediksi' => $payload['prediksi'],
            'skor_kendala' => $payload['skor_kendala'],
            'kendala_aktif' => array_map(fn ($k) => [
                'kategori_kendala' => $k['kategori_kendala'],
                'tingkat_keparahan' => $k['tingkat_keparahan'],
                'estimasi_hari_tertunda' => $k['estimasi_hari_tertunda'],
            ], $payload['kendala_aktif']),
        ];
    }

    protected function saranKendalaDominan(array $kendalaAktif): ?string
    {
        if ($kendalaAktif === []) {
            return null;
        }

        $bobot = config('pantera.kendala.keparahan');
        $skorPerKategori = [];
        foreach ($kendalaAktif as $k) {
            $skorPerKategori[$k['kategori_kendala']] =
                ($skorPerKategori[$k['kategori_kendala']] ?? 0) + ($bobot[$k['tingkat_keparahan']] ?? 1);
        }
        arsort($skorPerKategori);
        $dominan = array_key_first($skorPerKategori);

        return self::SARAN_KATEGORI[$dominan] ?? null;
    }
}
