<?php

use App\Enums\Role;
use App\Http\Controllers\ProfileController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

// Daftarkan hanya POST login/logout dari auth.php, atau taruh auth.php di bawah catch-all GET
require __DIR__ . '/auth.php';

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Catch-all SPA React untuk semua halaman (termasuk '/', '/login', '/admin/...', '/courses')
Route::get('/{any?}', function () {
    $demoAccounts = app()->isLocal()
        ? collect([Role::Admin, Role::Student])
        ->map(fn(Role $role) => User::where('role', $role)->first())
        ->filter()
        ->map(fn(User $user) => [
            'label' => ucfirst($user->role->value),
            'email' => $user->email,
            'password' => 'password',
        ])
        ->values()
        ->all()
        : [];

    return view('app', [
        'appConfig' => [
            'demoAccounts' => $demoAccounts,
        ],
    ]);
})->where('any', '^(?!api|sanctum).*$');
