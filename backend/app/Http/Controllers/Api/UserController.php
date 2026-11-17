<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Menampilkan daftar seluruh pengguna (khusus Direktur).
     */
    public function index(): JsonResponse
    {
        $users = User::latest('id_pengguna')->get();

        return $this->successResponse($users, 'Daftar pengguna berhasil dimuat.');
    }

    /**
     * Mendaftarkan pengguna baru (khusus Direktur).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:pengguna,email',
            'password' => 'required|string|min:6',
            'peran' => 'required|in:AdminLapangan,SekretarisKeuangan,Direktur',
            'status_aktif' => 'sometimes|boolean',
            'lokasi_tugas' => 'nullable|string|max:255',
            'nomor_kontak' => 'nullable|string|max:50',
            'divisi' => 'nullable|string|max:255',
            'batas_verifikasi_kas' => 'nullable|numeric|min:0',
            'batas_approval_nominal' => 'nullable|numeric|min:0',
        ]);

        $validated['password_hash'] = Hash::make($validated['password']);
        unset($validated['password']);

        $user = User::create($validated);

        return $this->successResponse($user, 'Pengguna baru berhasil ditambahkan.', 201);
    }
}
