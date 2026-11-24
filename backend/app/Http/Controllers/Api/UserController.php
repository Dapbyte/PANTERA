<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Menampilkan daftar seluruh pengguna (khusus Direktur).
     */
    public function index(): JsonResponse
    {
        $users = User::with('proyekAkses:id_proyek,kode_proyek,nama_proyek')
            ->latest('id_pengguna')
            ->get();

        return $this->successResponse($users, 'Daftar pengguna berhasil dimuat.');
    }

    /**
     * Mendaftarkan pengguna baru dengan password sementara & proyek akses opsional (GLB-13, GLB-14).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:pengguna,email',
            'password' => 'nullable|string|min:6',
            'peran' => 'required|in:AdminLapangan,SekretarisKeuangan,Direktur',
            'status_aktif' => 'sometimes|boolean',
            'lokasi_tugas' => 'nullable|string|max:255',
            'nomor_kontak' => 'nullable|string|max:50',
            'divisi' => 'nullable|string|max:255',
            'project_ids' => 'sometimes|array',
            'project_ids.*' => 'integer|exists:proyek,id_proyek',
        ], [
            'nama.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email perusahaan wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah terdaftar pada sistem.',
            'peran.required' => 'Peran pengguna wajib dipilih.',
        ]);

        $plainPassword = ! empty($validated['password'])
            ? (string) $validated['password']
            : Str::password(10, letters: true, numbers: true, symbols: false);

        $user = DB::transaction(function () use ($validated, $plainPassword) {
            $projectIds = $validated['project_ids'] ?? [];
            unset($validated['project_ids'], $validated['password']);

            $validated['password_hash'] = Hash::make($plainPassword);
            $validated['must_change_password'] = true;
            $validated['status_aktif'] = $validated['status_aktif'] ?? true;

            $user = User::create($validated);

            if ($user->peran === 'AdminLapangan' && ! empty($projectIds)) {
                $user->proyekAkses()->sync($projectIds);
            }

            return $user->fresh(['proyekAkses:id_proyek,kode_proyek,nama_proyek']);
        });

        $payload = array_merge($user ? $user->toArray() : [], [
            'temporary_password' => $plainPassword,
        ]);

        return $this->successResponse($payload, 'Pengguna baru berhasil ditambahkan.', 201);
    }

    /**
     * Memperbarui data, peran, akses proyek, atau status aktif pengguna (khusus Direktur).
     */
    public function update(Request $request, int $id_pengguna): JsonResponse
    {
        $user = User::find($id_pengguna);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'email' => "sometimes|required|email|unique:pengguna,email,{$id_pengguna},id_pengguna",
            'password' => 'nullable|string|min:6',
            'peran' => 'sometimes|required|in:AdminLapangan,SekretarisKeuangan,Direktur',
            'status_aktif' => 'sometimes|boolean',
            'lokasi_tugas' => 'nullable|string|max:255',
            'nomor_kontak' => 'nullable|string|max:50',
            'divisi' => 'nullable|string|max:255',
            'project_ids' => 'sometimes|array',
            'project_ids.*' => 'integer|exists:proyek,id_proyek',
        ]);

        $isSelf = (int) $request->user()->id_pengguna === (int) $user->id_pengguna;

        if ($isSelf && array_key_exists('status_aktif', $validated) && ! $validated['status_aktif']) {
            return $this->errorResponse('Anda tidak dapat menonaktifkan akun yang sedang digunakan.', 422);
        }

        if ($isSelf && isset($validated['peran']) && $validated['peran'] !== 'Direktur') {
            return $this->errorResponse('Anda tidak dapat mengubah peran akun Direktur yang sedang aktif.', 422);
        }

        $hasProjectIds = array_key_exists('project_ids', $validated);
        $projectIds = $validated['project_ids'] ?? [];
        unset($validated['project_ids']);

        if (! empty($validated['password'])) {
            $validated['password_hash'] = Hash::make($validated['password']);
            $validated['must_change_password'] = true;
        }
        unset($validated['password']);

        DB::transaction(function () use ($user, $validated, $hasProjectIds, $projectIds) {
            $user->update($validated);

            if ($user->peran !== 'AdminLapangan') {
                $user->proyekAkses()->detach();
            } elseif ($hasProjectIds) {
                $user->proyekAkses()->sync($projectIds);
            }
        });

        return $this->successResponse(
            $user->fresh(['proyekAkses:id_proyek,kode_proyek,nama_proyek']),
            'Data pengguna berhasil diperbarui.'
        );
    }

    /**
     * Menghapus akun pengguna (DIR-08). Khusus Direktur.
     */
    public function destroy(Request $request, int $id_pengguna): JsonResponse
    {
        $user = User::find($id_pengguna);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        if ((int) $request->user()->id_pengguna === (int) $user->id_pengguna) {
            return $this->errorResponse('Anda tidak dapat menghapus akun yang sedang digunakan.', 422);
        }

        $hasHistory = $user->proyekDibuat()->exists()
            || $user->materialDiajukan()->exists()
            || $user->arsipDicatat()->exists()
            || $user->progresDilaporkan()->exists();

        if ($hasHistory) {
            return $this->errorResponse(
                'Akun ini memiliki riwayat data proyek/arsip/pengajuan. Gunakan fitur Nonaktifkan agar riwayat audit tetap terjaga.',
                422
            );
        }

        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->proyekAkses()->detach();
            $user->notifikasiBaca()->delete();
            $user->delete();
        });

        return $this->successResponse(null, 'Akun pengguna berhasil dihapus.');
    }
}
