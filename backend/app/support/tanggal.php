<?php

namespace App\Support;

use Illuminate\Support\Carbon;

// membantu format tanggal ketika analisis statis sebagai date dan saat runtime sebagai carbon, make sure buat dua-duanya oke dan ga eror

// Yang atas dipake untuk tenggat bisa, yang bawah dipake untuk nampilin atau ngirim format carbon ke string buat pengolahan, iykyk

final class Tanggal
{
    public static function carbon(mixed $nilai): Carbon
    {
        return Carbon::parse($nilai);
    }

    public static function format(mixed $nilai): ?string
    {
        return $nilai == null ? null : Carbon::parse($nilai)->toDateString();
    }
}
