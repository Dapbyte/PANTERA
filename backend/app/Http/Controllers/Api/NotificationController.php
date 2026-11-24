<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArsipDokumen;
use App\Models\DokumenTermin;
use App\Models\KendalaLapangan;
use App\Models\MitraBank;
use App\Models\NotifikasiBaca;
use App\Models\ProgresFisik;
use App\Models\Proyek;
use App\Models\RequestMaterial;
use App\Models\Termin;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Ringkasan badge notifikasi per tab (GLB-05) & versi sinkronisasi realtime (GLB-04).
     */
    public function summary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $uid = (int) $user->id_pengguna;

        $seenMap = NotifikasiBaca::where('id_pengguna', $uid)
            ->pluck('last_seen_at', 'modul');

        $sinceFor = function (string $modul) use ($seenMap, $user): Carbon {
            $raw = $seenMap->get($modul);
            if ($raw) {
                return Carbon::parse($raw);
            }

            return $user->created_at
                ? Carbon::parse($user->created_at)
                : now()->subYears(5);
        };

        $allowedIds = $user->allowedProyekIds();
        $counts = [
            'beranda' => 0,
            'proyek' => 0,
            'termin' => 0,
            'kendala' => 0,
            'arsip' => 0,
            'contact' => 0,
            'users' => 0,
        ];

        // 1. Beranda per peran
        $sinceBeranda = $sinceFor('beranda');
        if ($user->isDirektur()) {
            $counts['beranda'] = RequestMaterial::where('status_approval', RequestMaterial::STATUS_MENUNGGU_DIREKTUR)
                ->where('updated_at', '>', $sinceBeranda)
                ->count();
        } elseif ($user->isSekretarisKeuangan()) {
            $counts['beranda'] = RequestMaterial::where('status_approval', RequestMaterial::STATUS_DIAJUKAN)
                ->where('id_pengaju', '!=', $uid)
                ->where('updated_at', '>', $sinceBeranda)
                ->count();
        } else {
            // Admin Lapangan: pengajuan yang dikembalikan/selesai + proyek baru ditugaskan
            $matCount = empty($allowedIds) ? 0 : RequestMaterial::whereIn('id_proyek', $allowedIds)
                ->where('id_pengaju', $uid)
                ->whereIn('status_approval', [
                    RequestMaterial::STATUS_PERLU_REVISI,
                    RequestMaterial::STATUS_SELESAI,
                ])
                ->where('updated_at', '>', $sinceBeranda)
                ->count();

            $assignCount = DB::table('proyek_pengguna')
                ->where('id_pengguna', $uid)
                ->where('updated_at', '>', $sinceBeranda)
                ->count();

            $revDocCount = empty($allowedIds) ? 0 : DokumenTermin::whereNotNull('catatan_revisi')
                ->where('updated_at', '>', $sinceBeranda)
                ->whereHas('termin', fn ($q) => $q->whereIn('id_proyek', $allowedIds))
                ->count();

            $counts['beranda'] = $matCount + $assignCount + $revDocCount;
        }

        // 2. Arsip (semua peran)
        $sinceArsip = $sinceFor('arsip');
        $arsipQuery = ArsipDokumen::where('id_pencatat', '!=', $uid)
            ->where('updated_at', '>', $sinceArsip);
        if ($allowedIds !== null) {
            if (empty($allowedIds)) {
                $counts['arsip'] = 0;
            } else {
                $counts['arsip'] = $arsipQuery->whereIn('id_proyek', $allowedIds)->count();
            }
        } else {
            $counts['arsip'] = $arsipQuery->count();
        }

        // 3. Tab spesifik peran
        if ($user->isDirektur()) {
            $sinceProyek = $sinceFor('proyek');
            $counts['proyek'] = ProgresFisik::where('id_pelapor', '!=', $uid)
                ->where('updated_at', '>', $sinceProyek)
                ->count();

            $sinceUsers = $sinceFor('users');
            $counts['users'] = User::where('id_pengguna', '!=', $uid)
                ->where('updated_at', '>', $sinceUsers)
                ->count();
        } elseif ($user->isSekretarisKeuangan()) {
            $sinceTermin = $sinceFor('termin');
            $progCount = ProgresFisik::where('id_pelapor', '!=', $uid)
                ->where('updated_at', '>', $sinceTermin)
                ->count();
            $dokCount = DokumenTermin::where('updated_at', '>', $sinceTermin)->count();
            $readyCount = Termin::where('status_penagihan', Termin::STATUS_SIAP_SERAH)
                ->where('updated_at', '>', $sinceTermin)
                ->count();
            $counts['termin'] = $progCount + $dokCount + $readyCount;

            $sinceContact = $sinceFor('contact');
            $counts['contact'] = Proyek::where('id_pembuat', '!=', $uid)
                ->where('updated_at', '>', $sinceContact)
                ->count();
        } else {
            $sinceKendala = $sinceFor('kendala');
            $counts['kendala'] = empty($allowedIds) ? 0 : KendalaLapangan::where('updated_at', '>', $sinceKendala)
                ->whereHas('progresFisik', function ($q) use ($allowedIds, $uid) {
                    $q->whereIn('id_proyek', $allowedIds)
                        ->where('id_pelapor', '!=', $uid);
                })
                ->count();
        }

        $badges = array_map(fn (int $c) => $c > 0, $counts);

        // Versi sinkronisasi lintas tabel untuk memicu auto-refresh React Query (GLB-04)
        $syncParts = [
            Proyek::max('updated_at') ?? '-',
            Proyek::count(),
            RequestMaterial::max('updated_at') ?? '-',
            RequestMaterial::count(),
            ArsipDokumen::max('updated_at') ?? '-',
            ArsipDokumen::count(),
            ProgresFisik::max('updated_at') ?? '-',
            KendalaLapangan::max('updated_at') ?? '-',
            Termin::max('updated_at') ?? '-',
            DokumenTermin::max('updated_at') ?? '-',
            MitraBank::max('updated_at') ?? '-',
            MitraBank::count(),
            User::max('updated_at') ?? '-',
            DB::table('proyek_pengguna')->count(),
            DB::table('proyek_pengguna')->max('updated_at') ?? '-',
        ];

        $syncVersion = sha1(implode('|', array_map('strval', $syncParts)));

        return $this->successResponse([
            'badges' => $badges,
            'counts' => $counts,
            'sync_version' => $syncVersion,
        ], 'Ringkasan notifikasi berhasil dimuat.');
    }

    /**
     * Menandai modul/tab tertentu sudah dilihat oleh user login (GLB-05).
     */
    public function markSeen(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modul' => ['required', 'in:beranda,proyek,termin,kendala,arsip,contact,users'],
        ]);

        /** @var User $user */
        $user = $request->user();

        NotifikasiBaca::updateOrCreate(
            [
                'id_pengguna' => (int) $user->id_pengguna,
                'modul' => (string) $validated['modul'],
            ],
            [
                'last_seen_at' => now(),
            ]
        );

        return $this->successResponse(null, 'Notifikasi modul ditandai sudah dilihat.');
    }
}
