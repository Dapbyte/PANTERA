<?php

use App\Http\Controllers\Api\ArchiveController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\EarlyWarningController;
use App\Http\Controllers\Api\KendalaController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TerminController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Health Check Endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'PANTERA API is running',
    ]);
});

// Autentikasi Pengguna (SD-01)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });
});

// Manajemen Pengguna (khusus Direktur)
Route::middleware(['auth:sanctum', 'role:Direktur'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
});

// Manajemen Proyek & RAB (UC-12 & SD-08)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{id_proyek}', [ProjectController::class, 'show']);

    Route::middleware('role:Direktur')->group(function () {
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::post('/projects/new', [ProjectController::class, 'store']);
    });
});

// Manajemen Arsip Fisik & Digital / Hibrida (UC-02, UC-11 & SD-07)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/archive', [ArchiveController::class, 'index']);
    Route::get('/archive/search', [ArchiveController::class, 'index']);
    Route::post('/archive', [ArchiveController::class, 'store']);
    Route::get('/archive/{id_arsip}', [ArchiveController::class, 'show']);
    Route::delete('/archive/{id_arsip}', [ArchiveController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Pembacaan: semua peran terautentikasi
    Route::get('/projects/{id_proyek}/progress', [ProgressController::class, 'index'])->whereNumber('id_proyek');
    Route::get('/projects/{id_proyek}/kendala', [KendalaController::class, 'index'])->whereNumber('id_proyek');
    Route::get('/projects/{id_proyek}/early-warning', [EarlyWarningController::class, 'show'])->whereNumber('id_proyek');
    Route::get('/projects/{id_proyek}/termin', [TerminController::class, 'index'])->whereNumber('id_proyek');
    Route::get('/termin/{id_termin}/checklist', [TerminController::class, 'checklist'])->whereNumber('id_termin');

    // Operasional lapangan & checklist dokumen: Admin Lapangan
    Route::middleware('role:AdminLapangan')->group(function () {
        Route::post('/projects/{id_proyek}/progress', [ProgressController::class, 'store'])->whereNumber('id_proyek');
        Route::post('/projects/{id_proyek}/kendala', [KendalaController::class, 'store'])->whereNumber('id_proyek');
        Route::patch('/kendala/{id_kendala}/resolve', [KendalaController::class, 'resolve'])->whereNumber('id_kendala');
        Route::post('/termin/{id_termin}/dokumen', [TerminController::class, 'uploadDokumen'])->whereNumber('id_termin');
        Route::patch('/termin/{id_termin}/dokumen/{id_dokumen}/verifikasi', [TerminController::class, 'verifikasiDokumen'])
            ->whereNumber(['id_termin', 'id_dokumen']);
    });

    // Penagihan ke dinas & SP2D: Sekretaris/Keuangan
    Route::middleware('role:SekretarisKeuangan')->group(function () {
        Route::post('/termin/{id_termin}/ajukan', [BillingController::class, 'ajukan'])->whereNumber('id_termin');
        Route::post('/termin/{id_termin}/koreksi', [BillingController::class, 'koreksi'])->whereNumber('id_termin');
        Route::post('/termin/{id_termin}/sp2d', [BillingController::class, 'sp2d'])->whereNumber('id_termin');
    });

    // Portofolio early warning seluruh proyek: Direktur & Sekretaris/Keuangan
    Route::middleware('role:Direktur,SekretarisKeuangan')->group(function () {
        Route::get('/early-warning', [EarlyWarningController::class, 'index']);
    });
});
