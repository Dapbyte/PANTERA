<?php

use App\Http\Controllers\Api\ArchiveController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankCreditController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\EarlyWarningController;
use App\Http\Controllers\Api\KendalaController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\MitraBankController;
use App\Http\Controllers\Api\NotificationController;
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
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

// Notifikasi Badge & Sinkronisasi Realtime (GLB-04 & GLB-05)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications/summary', [NotificationController::class, 'summary']);
    Route::post('/notifications/seen', [NotificationController::class, 'markSeen']);
});

// Manajemen Pengguna (khusus Direktur)
Route::middleware(['auth:sanctum', 'role:Direktur'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{id_pengguna}', [UserController::class, 'update'])->whereNumber('id_pengguna');
    Route::delete('/users/{id_pengguna}', [UserController::class, 'destroy'])->whereNumber('id_pengguna');
});

// Manajemen Proyek & RAB
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{id_proyek}', [ProjectController::class, 'show'])->whereNumber('id_proyek');

    Route::middleware('role:Direktur')->group(function () {
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::post('/projects/new', [ProjectController::class, 'store']);
        Route::put('/projects/{id_proyek}', [ProjectController::class, 'update'])->whereNumber('id_proyek');
        Route::delete('/projects/{id_proyek}', [ProjectController::class, 'destroy'])->whereNumber('id_proyek');
    });
});

// Manajemen Arsip Fisik & Digital / Hibrida
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/archive', [ArchiveController::class, 'index']);
    Route::get('/archive/search', [ArchiveController::class, 'index']);
    Route::post('/archive', [ArchiveController::class, 'store']);
    Route::get('/archive/{id_arsip}/file', [ArchiveController::class, 'file'])->whereNumber('id_arsip');
    Route::get('/archive/{id_arsip}', [ArchiveController::class, 'show'])->whereNumber('id_arsip');
    Route::patch('/archive/{id_arsip}', [ArchiveController::class, 'update'])->whereNumber('id_arsip');

    Route::middleware('role:Direktur')->group(function () {
        Route::delete('/archive/{id_arsip}', [ArchiveController::class, 'destroy'])->whereNumber('id_arsip');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // Pembacaan: sesuai proyek yang diizinkan per peran
    Route::get('/projects/{id_proyek}/progress', [ProgressController::class, 'index'])->whereNumber('id_proyek');
    Route::get('/projects/{id_proyek}/kendala', [KendalaController::class, 'index'])->whereNumber('id_proyek');
    Route::get('/projects/{id_proyek}/early-warning', [EarlyWarningController::class, 'show'])->whereNumber('id_proyek');
    Route::get('/projects/{id_proyek}/termin', [TerminController::class, 'index'])->whereNumber('id_proyek');
    Route::get('/termin/{id_termin}/checklist', [TerminController::class, 'checklist'])->whereNumber('id_termin');
    Route::get('/termin/{id_termin}/dokumen/{id_dokumen}/file', [TerminController::class, 'fileDokumen'])
        ->whereNumber(['id_termin', 'id_dokumen']);

    // Operasional lapangan & unggah dokumen termin: Admin Lapangan
    Route::middleware('role:AdminLapangan')->group(function () {
        Route::post('/projects/{id_proyek}/progress', [ProgressController::class, 'store'])->whereNumber('id_proyek');
        Route::post('/projects/{id_proyek}/kendala', [KendalaController::class, 'store'])->whereNumber('id_proyek');
        Route::patch('/kendala/{id_kendala}/resolve', [KendalaController::class, 'resolve'])->whereNumber('id_kendala');
        Route::post('/termin/{id_termin}/dokumen', [TerminController::class, 'uploadDokumen'])->whereNumber('id_termin');
    });

    // Verifikasi dokumen termin, penagihan ke dinas & SP2D: Sekretaris/Keuangan
    Route::middleware('role:SekretarisKeuangan')->group(function () {
        Route::patch('/termin/{id_termin}/dokumen/{id_dokumen}/verifikasi', [TerminController::class, 'verifikasiDokumen'])
            ->whereNumber(['id_termin', 'id_dokumen']);
        Route::post('/termin/{id_termin}/ajukan', [BillingController::class, 'ajukan'])->whereNumber('id_termin');
        Route::post('/termin/{id_termin}/koreksi', [BillingController::class, 'koreksi'])->whereNumber('id_termin');
        Route::post('/termin/{id_termin}/sp2d', [BillingController::class, 'sp2d'])->whereNumber('id_termin');
    });

    // Portofolio early warning seluruh proyek, mitra bank, & koordinasi bank
    Route::middleware('role:Direktur,SekretarisKeuangan')->group(function () {
        Route::get('/early-warning', [EarlyWarningController::class, 'index']);
        Route::get('/bank-credits', [BankCreditController::class, 'index']);
        Route::get('/mitra-bank', [MitraBankController::class, 'index']);
        Route::get('/projects/{id_proyek}/performance-report', [BankCreditController::class, 'performanceReport'])
            ->whereNumber('id_proyek');
    });

    // Pencatatan & update kesepakatan fasilitas kredit bank serta mitra bank dinamis: Keuangan
    Route::middleware('role:SekretarisKeuangan')->group(function () {
        Route::post('/bank-credits', [BankCreditController::class, 'store']);
        Route::patch('/bank-credits/{id_kredit}', [BankCreditController::class, 'update'])
            ->whereNumber('id_kredit');
        Route::post('/mitra-bank', [MitraBankController::class, 'store']);
        Route::patch('/mitra-bank/{id_bank}', [MitraBankController::class, 'update'])->whereNumber('id_bank');
        Route::delete('/mitra-bank/{id_bank}', [MitraBankController::class, 'destroy'])->whereNumber('id_bank');
    });

    // Verifikasi pengawas untuk progres fisik
    Route::middleware('role:AdminLapangan,SekretarisKeuangan,Direktur')->group(function () {
        Route::patch('/progress/{id_progres}/verifikasi', [ProgressController::class, 'verifikasi'])
            ->whereNumber('id_progres');
    });
});

// Manajemen Pengajuan Material & Approval (alur baru: Lapangan volume -> Keuangan harga/vendor -> Direktur final)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/material-requests', [MaterialController::class, 'index']);
    Route::get('/material-requests/{id_request}', [MaterialController::class, 'show'])
        ->whereNumber('id_request');

    Route::middleware('role:AdminLapangan')->group(function () {
        Route::post('/material-requests', [MaterialController::class, 'store']);
        Route::put('/material-requests/{id_request}', [MaterialController::class, 'update'])
            ->whereNumber('id_request');
    });

    Route::middleware('role:SekretarisKeuangan')->group(function () {
        Route::patch('/material-requests/{id_request}/validate', [MaterialController::class, 'validateFinance'])
            ->whereNumber('id_request');
    });

    Route::middleware('role:Direktur')->group(function () {
        Route::patch('/material-requests/{id_request}/approve', [MaterialController::class, 'approve'])
            ->whereNumber('id_request');
    });
});
