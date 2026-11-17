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

        $user = User::where('email', $validated['email'])->first();

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
                'status_aktif' => $user->status_aktif,
                'lokasi_tugas' => $user->lokasi_tugas,
                'nomor_kontak' => $user->nomor_kontak,
                'divisi' => $user->divisi,
                'batas_verifikasi_kas' => $user->batas_verifikasi_kas,
                'batas_approval_nominal' => $user->batas_approval_nominal,
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
        return $this->successResponse($request->user(), 'Data profil pengguna.');
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
            unset($validated['password']);
        }

        $user->update($validated);

        return $this->successResponse($user->fresh(), 'Profil berhasil diperbarui.');
    }
}
