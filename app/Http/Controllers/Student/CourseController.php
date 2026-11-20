<?php

namespace App\Http\Controllers\Student;

use App\Enums\CourseStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CourseController extends Controller
{
    /**
     * Menampilkan katalog kursus yang sudah Terbit (Published).
     * GET /api/courses
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) ($request->query('q') ?? $request->query('search', '')));

        $query = Course::query()
            ->where('status', CourseStatus::Published->value)
            ->withCount('lessons')
            ->latest('updated_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return CourseResource::collection($query->paginate(12));
    }

    /**
     * Menampilkan detail kursus & daftar pelajaran beserta signed URL videonya.
     * GET /api/courses/{course}
     */
    public function show(Course $course): CourseResource
    {
        abort_if(
            ! $this->isPublished($course),
            404,
            'Kursus tidak ditemukan atau belum diterbitkan.'
        );

        $course->load([
            'lessons' => fn ($query) => $query->orderBy('position'),
        ])->loadCount('lessons');

        return new CourseResource($course);
    }

    /**
     * Menampilkan detail pelajaran aktif & navigasi sebelumnya/berikutnya untuk LessonPlayer.
     * GET /api/courses/{course}/lessons/{lesson}
     */
    public function lesson(Course $course, Lesson $lesson): JsonResponse
    {
        abort_if(
            ! $this->isPublished($course) || $lesson->course_id !== $course->id,
            404,
            'Pelajaran tidak ditemukan.'
        );

        $lessons = $course->lessons()->orderBy('position')->get();
        $course->setRelation('lessons', $lessons);

        $index = $lessons->search(fn (Lesson $item) => $item->id === $lesson->id);
        abort_if($index === false, 404);

        $previous = $index > 0 ? $lessons[$index - 1] : null;
        $next = $index < $lessons->count() - 1 ? $lessons[$index + 1] : null;

        return response()->json([
            'course'      => (new CourseResource($course))->resolve(),
            'lesson'      => (new LessonResource($lesson))->resolve(),
            'position'    => $index + 1,
            'total'       => $lessons->count(),
            'previous_id' => $previous?->id,
            'next_id'     => $next?->id,
        ]);
    }

    private function isPublished(Course $course): bool
    {
        $status = $course->status instanceof CourseStatus
            ? $course->status->value
            : (string) $course->status;

        return $status === CourseStatus::Published->value;
    }
}