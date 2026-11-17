<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    use ApiResponse;

    /**
     * Menangani verifikasi status_aktif dan peran (RBAC) pengguna terautentikasi.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse('Autentikasi gagal atau sesi telah berakhir.', 401);
        }

        if (! $user->status_aktif) {
            return $this->errorResponse('Akses ditolak: Akun pengguna dinonaktifkan.', 403);
        }

        // Normalisasi daftar role (mendukung 'role:Direktur' dan 'role:Direktur,SekretarisKeuangan')
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $trimmed = trim($r);
                if ($trimmed !== '') {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        if (! empty($allowedRoles) && ! in_array($user->peran, $allowedRoles, true)) {
            return $this->errorResponse('Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.', 403);
        }

        return $next($request);
    }
}
