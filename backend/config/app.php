<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

    'name' => env('APP_NAME', 'Laravel'),

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. The timezone
    | is set to "UTC" by default as it is suitable for most use cases.
    |
    */

    'timezone' => 'UTC',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', '')),
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache", "array"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

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
        'foto_progres' => 'Foto progres pekerjaan lapangan',
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
    | Groq memakai format API yang kompatibel dengan OpenAI (chat/completions).
    | Model llama-3.3-70b-versatile & llama-3.1-8b-instant sudah dipensiunkan
    | Groq (16 Agu 2026); penggantinya openai/gpt-oss-20b atau openai/gpt-oss-120b.
    | Daftar model terbaru: https://console.groq.com/docs/models
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
