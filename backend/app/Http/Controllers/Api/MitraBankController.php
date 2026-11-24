<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraBank;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MitraBankController extends Controller
{
    use ApiResponse;

    /**
     * Daftar mitra perbankan kredit konstruksi dinamis (KEU-07).
     */
    public function index(): JsonResponse
    {
        $banks = MitraBank::orderBy('nama_bank')->get();

        return $this->successResponse($banks, 'Daftar mitra bank berhasil dimuat.');
    }

    /**
     * Menambahkan mitra bank baru. Khusus Keuangan.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama_bank' => ['required', 'string', 'max:120', 'unique:mitra_bank,nama_bank'],
            'kontak' => ['nullable', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ], [
            'nama_bank.required' => 'Nama bank mitra wajib diisi.',
            'nama_bank.unique' => 'Nama bank mitra sudah terdaftar.',
        ]);

        $bank = MitraBank::create([
            'nama_bank' => trim((string) $validated['nama_bank']),
            'kontak' => isset($validated['kontak']) ? trim((string) $validated['kontak']) : null,
            'catatan' => isset($validated['catatan']) ? trim((string) $validated['catatan']) : null,
        ]);

        return $this->successResponse($bank, 'Mitra bank berhasil ditambahkan.', 201);
    }

    /**
     * Memperbarui data mitra bank. Khusus Keuangan.
     */
    public function update(Request $request, int $id_bank): JsonResponse
    {
        $bank = MitraBank::find($id_bank);

        if (! $bank) {
            return $this->errorResponse('Mitra bank tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'nama_bank' => ['required', 'string', 'max:120', "unique:mitra_bank,nama_bank,{$id_bank},id_bank"],
            'kontak' => ['nullable', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);

        $bank->update([
            'nama_bank' => trim((string) $validated['nama_bank']),
            'kontak' => isset($validated['kontak']) ? trim((string) $validated['kontak']) : null,
            'catatan' => isset($validated['catatan']) ? trim((string) $validated['catatan']) : null,
        ]);

        return $this->successResponse($bank->fresh(), 'Data mitra bank berhasil diperbarui.');
    }

    /**
     * Menghapus mitra bank dari daftar dinamis. Khusus Keuangan.
     */
    public function destroy(int $id_bank): JsonResponse
    {
        $bank = MitraBank::find($id_bank);

        if (! $bank) {
            return $this->errorResponse('Mitra bank tidak ditemukan.', 404);
        }

        $bank->delete();

        return $this->successResponse(null, 'Mitra bank berhasil dihapus.');
    }
}
