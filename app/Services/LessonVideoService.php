<?php

namespace App\Services;

use App\Enums\VideoStatus;
use App\Models\Lesson;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class LessonVideoService
{
    private const DISK = 'local';
    private const DIRECTORY = 'videos';

    /**
     * Menyimpan atau mengganti file video pada lesson ke disk privat.
     */
    public function store(Lesson $lesson, UploadedFile $file): Lesson
    {
        $previousPath = $lesson->video_path;
        $hasPreviousVideo = $lesson->video_status === VideoStatus::Ready && ! empty($previousPath);

        // 1. Tandai status sedang memproses/uploading
        $lesson->update([
            'video_status' => VideoStatus::Uploading,
            'video_error' => null,
        ]);

        try {
            $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'mp4');
            $filename = Str::uuid() . '.' . $extension;

            // 2. Simpan ke privat storage/app/private/videos/{uuid}.{ext}
            $storedPath = $file->storeAs(self::DIRECTORY, $filename, self::DISK);

            if (! $storedPath) {
                throw new \RuntimeException('Gagal menulis file video ke penyimpanan lokal.');
            }

            // 3. Perbarui metadata video ke status Ready
            $lesson->update([
                'video_status' => VideoStatus::Ready,
                'video_path' => $storedPath,
                'video_original_name' => $file->getClientOriginalName(),
                'video_mime' => $file->getMimeType() ?? $file->getClientMimeType(),
                'video_size' => $file->getSize(),
                'video_error' => null,
            ]);

            // 4. Hapus file video lama jika ada
            if ($hasPreviousVideo && $previousPath !== $storedPath) {
                $this->deleteFileIfExists($previousPath);
            }

            return $lesson->fresh();
        } catch (Throwable $e) {
            Log::error('Gagal mengunggah video lesson', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage(),
            ]);

            // Jika sebelumnya sudah ada video valid, kembalikan ke Ready agar video lama tidak hilang
            if ($hasPreviousVideo) {
                $lesson->update([
                    'video_status' => VideoStatus::Ready,
                    'video_error' => 'Gagal mengganti video: ' . $e->getMessage(),
                ]);
            } else {
                $lesson->update([
                    'video_status' => VideoStatus::Failed,
                    'video_error' => $e->getMessage(),
                ]);
            }

            throw $e;
        }
    }

    /**
     * Menghapus file fisik video dan mereset metadata video pada lesson.
     */
    public function delete(Lesson $lesson): Lesson
    {
        $this->deleteFileIfExists($lesson->video_path);

        $lesson->update([
            'video_status' => VideoStatus::None,
            'video_path' => null,
            'video_original_name' => null,
            'video_mime' => null,
            'video_size' => null,
            'video_error' => null,
        ]);

        return $lesson->fresh();
    }

    /**
     * Menghapus file fisik saja tanpa mengubah database (dipakai saat hapus lesson/course).
     */
    public function deleteFileIfExists(?string $path): void
    {
        if (! empty($path) && Storage::disk(self::DISK)->exists($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }
}
