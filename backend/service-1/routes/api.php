<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController\FormationController;
use App\Http\Controllers\UserController;

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Hello API Laravel'
    ]);
});

Route::get('/admin', function () {
    return "Admin only";
})->middleware(['auth:api', 'role:admin']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'consulterProfil']);
    Route::put('/update-profile', [ProfileController::class, 'updateProfil']);
    Route::post('/update-password', [ProfileController::class, 'updatePassword']);
    Route::post('/update-avatar', [ProfileController::class, 'updateAvatar']);
});

Route::post('/forgot-password', [PasswordController::class, 'forgotPassword']);
Route::post('/reset-password', [PasswordController::class, 'resetPassword']);

// Public endpoints for "Nos Formateurs" navbar feature
Route::get('/formateurs-publics', [UserController::class, 'getFormateursPublics']);
Route::get('/formateurs-publics/{domaine}', [UserController::class, 'getFormateursByDomaine']);

Route::middleware(['auth:api', 'role:admin,formateur'])->group(function () {
    Route::post('/add-candidat', [UserController::class, 'AddCandidat']);
    Route::get('/candidats', [UserController::class, 'showCandidats']);
    Route::delete('/delete-user/{id}', [UserController::class, 'deleteUser']);
    Route::put('/update-user/{id}', [UserController::class, 'updateUser']);
    Route::get('/filtre-candidats', [UserController::class, 'filtreCandidatsByStatus']);
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'getAllUsers']);
    Route::get('/formateurs', [UserController::class, 'showFormateurs']);
    Route::post('/add-formateur', [UserController::class, 'AddFormateur']);
    Route::get('/filtre-formateurs', [UserController::class, 'filtreFormateursByStatus']);
    Route::put('/update-user-status/{id}', [UserController::class, 'updateUserStatus']);
});

