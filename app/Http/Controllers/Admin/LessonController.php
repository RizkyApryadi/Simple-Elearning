<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Models\Lesson;
use App\Services\LessonVideoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Http\Requests\UpdateLessonRequest;
use Illuminate\Http\Response;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index(Course $course): AnonymousResourceCollection
    {
        $lesson = $course->lessons()
            ->orderBy('position')
            ->get();

        return LessonResource::collection($lesson);
    }

    public function store(StoreLessonRequest $request, Course $course, LessonVideoService $videoService): JsonResponse
    {
        $data = $request->validated();
        $lesson = DB::transaction(function () use ($request, $course, $data, $videoService) {
            $position = $data['position'] ?? (($course->lessons()->max('position') ?? 0) + 1);

            $lesson = $course->lessons()->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'position' => $position,
                'video_status' => VideoStatus::None,
            ]);

            if ($request->hasFile('video')) {
                $lesson = $videoService->store($lesson, $request->file('video'));
            }

            return $lesson;
        });

        return (new LessonResource($lesson))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Course $course, Lesson $lesson): LessonResource
    {
        return new LessonResource($lesson);
    }

    public function update(UpdateLessonRequest $request, Course $course, Lesson $lesson, LessonVideoService $videoService): LessonResource
    {
        $data = $request->validated();

        $lesson = DB::transaction(function () use ($request, $lesson, $data, $videoService) {
            $lesson->update([
                'title' => $data['title'] ?? $lesson->title,
                'description' => array_key_exists('description', $data) ? $data['description'] : $lesson->description,
                'position' => $data['position'] ?? $lesson->position,
            ]);

            if ($request->hasFile('video')) {
                $lesson = $videoService->store($lesson, $request->file('video'));
            } elseif (! empty($data['remove_video'])) {
                $lesson = $videoService->delete($lesson);
            }

            return $lesson->fresh();
        });

        return new LessonResource($lesson);
    }

    public function destroy(Course $course, Lesson $lesson, LessonVideoService $videoService): Response
    {
        $videoPath = $lesson->video_path;

        DB::transaction(function () use ($lesson) {
            $lesson->delete();
        });

        $videoService->deleteFileIfExists($videoPath);

        return response()->noContent();
    }

    public function reorder(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        foreach ($validated['ids'] as $index => $id) {
            $course->lessons()
                ->where('id', $id)
                ->update(['position' => $index + 1]);
        }

        return response()->json([
            'message' => 'Urutan pelajaran diperbarui.',
        ]);
    }
}
