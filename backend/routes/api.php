<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
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
