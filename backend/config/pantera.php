<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dokumen wajib termin (standar dinas) - UC-10
    |--------------------------------------------------------------------------
    | key   : disimpan di kolom dokumen_termin.jenis_dokumen
    | value : label yang ditampilkan di antarmuka
    */
    'dokumen_termin_wajib' => [
        'laporan_mingguan' => 'Laporan mingguan kemajuan fisik',
        'backup_hitungan' => 'Back-up data hitungan volume',
        'foto_progres' => 'Dokumentasi foto progres (lampiran berkas dinas)',
        'berita_acara' => 'Berita acara kemajuan pekerjaan',
    ],

    /*
    |--------------------------------------------------------------------------
    | Kendala lapangan - UC-09
    |--------------------------------------------------------------------------
    | keparahan: nama => bobot (dipakai menghitung skor kendala di early warning)
    */
    'kendala' => [
        'kategori' => ['Cuaca', 'Material', 'Tenaga Kerja', 'Peralatan', 'Teknis'],
        'keparahan' => [
            'Ringan' => 1,
            'Sedang' => 2,
            'Berat' => 3,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Early warning termin - UC-04
    |--------------------------------------------------------------------------
    */
    'early_warning' => [
        // 'rule' = rekomendasi dari template aturan (default, tanpa API eksternal)
        // 'llm'  = rekomendasi narasi dari LLM; otomatis fallback ke 'rule' jika gagal
        'driver' => env('EARLY_WARNING_DRIVER', 'rule'),

        // Ketertinggalan (poin persen) yang masih ditoleransi sebelum status Waspada
        'toleransi_deviasi' => (float) env('EARLY_WARNING_TOLERANSI', 2.0),

        // Ketertinggalan (poin persen) yang membuat status Kritis
        'ambang_kritis_deviasi' => (float) env('EARLY_WARNING_AMBANG_KRITIS', 10.0),

        // Skor kendala aktif (jumlah bobot keparahan)
        'ambang_skor_waspada' => 3,
        'ambang_skor_kritis' => 6,

        // Estimasi kerugian per hari keterlambatan = nilai_tagihan x tarif ini (0,001 = 1 permil)
        'tarif_kerugian_per_hari' => (float) env('EARLY_WARNING_TARIF_KERUGIAN', 0.001),

        // Jumlah laporan progres terakhir yang dipakai menghitung laju (poin/hari)
        'jendela_laju_laporan' => 3,
    ],

    /*
    |--------------------------------------------------------------------------
    | Checklist dokumen termin - UC-10
    |--------------------------------------------------------------------------
    */
    'checklist' => [
        // Peringatan muncul jika berkas belum lengkap dan tenggat <= N hari lagi
        'ambang_hari_peringatan' => 7,
    ],

    /*
    |--------------------------------------------------------------------------
    | LLM via Groq (opsional, hanya dipakai jika early_warning.driver = 'llm')
    |--------------------------------------------------------------------------
    */
    'llm' => [
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('EARLY_WARNING_LLM_MODEL', 'openai/gpt-oss-20b'),
        'endpoint' => env('GROQ_ENDPOINT', 'https://api.groq.com/openai/v1/chat/completions'),
        'timeout' => 15,
        'max_completion_tokens' => 1024,
        // Khusus model reasoning (gpt-oss): low | medium | high.
        // KOSONGKAN jika memakai model non-reasoning agar parameter ini tidak dikirim.
        'reasoning_effort' => env('EARLY_WARNING_LLM_REASONING', 'low'),
        'cache_detik' => 3600,
    ],

];
