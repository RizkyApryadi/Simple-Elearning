<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Services\LessonVideoService;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;


class CourseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $searchTerm = $request->string('q')->toString()
            ?: $request->string('search')->toString();

        $courses = Course::query()
            ->withCount('lessons', 'readyLessons')
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->string('status')))
            ->search($searchTerm)
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return CourseResource::collection($courses);
    }

    public function show(Course $course): CourseResource
    {
        $course->load(['lessons' => fn($q) => $q->orderBy('position')]) //asc
            ->loadCount('lessons');

        return new CourseResource($course);
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $course = Course::create([
            ...$data,
            'status' => $data['status'] ?? 'draft',
            'created_by' => $request->user()->id,
        ]);

        return (new CourseResource($course))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCourseRequest $request, Course $course): CourseResource
    {
        $data = $request->validated();

        if ($request->hasFile('thumbnail')) {
            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $course->update($data);

        $course->load(['lessons' => fn($q) => $q->orderBy('position')])
            ->loadCount('lessons', 'readyLessons');

        return new CourseResource($course->fresh());
    }

    public function destroy(Course $course): JsonResponse
    {
        // 1 thumbnail
        if ($course->thumbnail) {
            Storage::disk('public')->delete($course->thumbnail);
        }

        // 2. File video dari setiap lessons
        foreach ($course->lessons as $lesson) {
            if ($lesson->video_path) {
                Storage::disk('local')->delete($lesson->video_path);
            }
        }

        // 3. Course
        $course->delete();
        return response()->json([
            'message' => 'Course Berhasil Dihapus.',
        ], 200);
    }
}
