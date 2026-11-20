<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Services\LessonVideoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LessonVideoController extends Controller
{
    public function __construct(
        private readonly LessonVideoService $videoService
    ) {}

    /**
     * Unggah / ganti video pelajaran.
     * POST /api/admin/lessons/{lesson}/video
     */
    public function store(Request $request, Lesson $lesson): LessonResource
    {
        $maxKb = (int) config('elearning.max_video_mb', 200) * 1024;
        $mimes = implode(',', config('elearning.video_extensions', ['mp4', 'webm', 'mov', 'ogv']));

        $validated = $request->validate([
            'video' => ['required', 'file', "mimes:{$mimes}", "max:{$maxKb}"],
        ], [
            'video.required' => 'Pilih file video terlebih dahulu.',
            'video.mimes'    => 'Format video harus MP4, WebM, MOV, atau OGV.',
            'video.max'      => 'Ukuran video melebihi batas maksimal server.',
        ]);

        $this->videoService->store($lesson, $validated['video']);

        return new LessonResource($lesson->fresh());
    }

    /**
     * Stream video dari disk privat (mendukung HTTP Range untuk seek/skip player).
     * GET /api/lessons/{lesson}/stream
     */
    public function stream(Lesson $lesson): BinaryFileResponse
    {
        abort_if(
            $lesson->video_status !== VideoStatus::Ready || empty($lesson->video_path),
            404,
            'Video tidak tersedia.'
        );

        $disk = Storage::disk('local');

        abort_unless(
            $disk->exists($lesson->video_path),
            404,
            'File video tidak ditemukan di penyimpanan.'
        );

        return response()->file($disk->path($lesson->video_path), [
            'Content-Type' => $lesson->video_mime ?? 'video/mp4',
        ]);
    }

    /**
     * Hapus video dari pelajaran tanpa menghapus data pelajarannya.
     * DELETE /api/admin/lessons/{lesson}/video
     */
    public function destroy(Lesson $lesson): LessonResource
    {
        $this->videoService->delete($lesson);

        return new LessonResource($lesson->fresh());
    }
}