<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Endpoint login pengguna (SD-01).
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('proyekAkses:id_proyek,kode_proyek,nama_proyek')
            ->where('email', $validated['email'])
            ->first();

        // Cek kredensial
        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            return $this->errorResponse('Kredensial login tidak valid.', 401);
        }

        // Cek status aktif
        if (! $user->status_aktif) {
            return $this->errorResponse('Akun pengguna tidak aktif.', 401);
        }

        // Buat Sanctum access token
        $token = $user->createToken('pantera_auth_token')->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'peran' => $user->peran,
            'user' => [
                'id_pengguna' => $user->id_pengguna,
                'nama' => $user->nama,
                'email' => $user->email,
                'peran' => $user->peran,
                'status_aktif' => (bool) $user->status_aktif,
                'must_change_password' => (bool) $user->must_change_password,
                'lokasi_tugas' => $user->lokasi_tugas,
                'nomor_kontak' => $user->nomor_kontak,
                'divisi' => $user->divisi,
                'proyek_akses' => $user->proyekAkses,
            ],
        ], 'Login berhasil.');
    }

    /**
     * Endpoint logout pengguna untuk mencabut token aktif.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logout berhasil.');
    }

    /**
     * Endpoint untuk mendapatkan data profil pengguna yang sedang login.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('proyekAkses:id_proyek,kode_proyek,nama_proyek');

        return $this->successResponse($user, 'Data profil pengguna.');
    }

    /**
     * Endpoint untuk memperbarui data profil pengguna.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'nomor_kontak' => 'nullable|string|max:50',
            'lokasi_tugas' => 'nullable|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
        ]);

        if (! empty($validated['password'])) {
            $validated['password_hash'] = Hash::make($validated['password']);
            $validated['must_change_password'] = false;
            unset($validated['password']);
        }

        $user->update($validated);

        return $this->successResponse(
            $user->fresh(['proyekAkses:id_proyek,kode_proyek,nama_proyek']),
            'Profil berhasil diperbarui.'
        );
    }

    /**
     * Mengganti password pengguna (wajib saat login pertama dengan password sementara - GLB-13).
     */
    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $rules = [
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ];

        if (! $user->must_change_password) {
            $rules['current_password'] = ['required', 'string'];
        } else {
            $rules['current_password'] = ['nullable', 'string'];
        }

        $validated = $request->validate($rules, [
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
        ]);

        if (
            ! empty($validated['current_password'])
            && ! Hash::check($validated['current_password'], $user->password_hash)
        ) {
            return $this->errorResponse('Kata sandi saat ini tidak sesuai.', 422, [
                'current_password' => ['Kata sandi saat ini tidak sesuai.'],
            ]);
        }

        $user->update([
            'password_hash' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        return $this->successResponse(
            $user->fresh(['proyekAkses:id_proyek,kode_proyek,nama_proyek']),
            'Kata sandi berhasil diperbarui.'
        );
    }
}
