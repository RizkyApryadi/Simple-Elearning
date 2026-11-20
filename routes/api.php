<?php

use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\LessonVideoController as AdminLessonVideoController;
use App\Http\Controllers\Student\CourseController as StudentCourseController;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Endpoint Auth SPA yang dipanggil oleh React (AuthContext / api.js)
Route::post('/login', function (LoginRequest $request) {
    $request->authenticate();
    $request->session()->regenerate();

    return response()->json($request->user());
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', function (Request $request) {
        return response()->json($request->user());
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', function (Request $request) {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    });

    // Endpoint untuk Student
    Route::get('/courses', [StudentCourseController::class, 'index'])->name('api.courses.index');
    Route::get('/courses/{course}', [StudentCourseController::class, 'show'])->name('api.courses.show');
    Route::get('/courses', [StudentCourseController::class, 'index'])->name('api.courses.index');
    Route::get('/courses/{course}', [StudentCourseController::class, 'show'])->name('api.courses.show');
    Route::get('/courses/{course}/lessons/{lesson}', [StudentCourseController::class, 'lesson'])->name('api.courses.lessons.show');
});

Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->name('api.admin.')
    ->group(function () {
        // Courses
        Route::get('/courses', [AdminCourseController::class, 'index'])->name('courses.index');
        Route::post('/courses', [AdminCourseController::class, 'store'])->name('course.store');
        Route::get('/courses/{course}', [AdminCourseController::class, 'show'])->name('courses.show');
        Route::match(['put', 'patch'], '/courses/{course}', [AdminCourseController::class, 'update'])->name('courses.update');
        Route::delete('/courses/{course}', [AdminCourseController::class, 'destroy'])->name('courses.destroy');

        // Reorder Lessons
        Route::put('/courses/{course}/lessons/reorder', [AdminLessonController::class, 'reorder'])->name('courses.lessons.reorder');

        // Lessons (Nested create & index)
        Route::get('/courses/{course}/lessons', [AdminLessonController::class, 'index'])->name('courses.lessons.index');
        Route::post('/courses/{course}/lessons', [AdminLessonController::class, 'store'])->name('courses.lessons.store');

        // Lessons (Shallow show, update, delete & video upload/delete)
        Route::get('/lessons/{lesson}', [AdminLessonController::class, 'show'])->name('lessons.show');
        Route::match(['put', 'patch'], '/lessons/{lesson}', [AdminLessonController::class, 'update'])->name('lessons.update');
        Route::delete('/lessons/{lesson}', [AdminLessonController::class, 'destroy'])->name('lessons.destroy');

        // Video upload & delete di lesson (arahkan ke LessonVideoController)
        Route::post('/lessons/{lesson}/video', [AdminLessonVideoController::class, 'store'])->name('lessons.video.store');
        Route::delete('/lessons/{lesson}/video', [AdminLessonVideoController::class, 'destroy'])->name('lessons.video.destroy');
    });

Route::get('/lessons/{lesson}/stream', [AdminLessonVideoController::class, 'stream'])
    ->name('lessons.stream')
    ->middleware('signed');
