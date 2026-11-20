<?php

namespace App\Http\Resources;

use App\Enums\VideoStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

class LessonResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->video_status ?? VideoStatus::None;
        $isPlayable = $this->hasPlayableVideo();
        $streamRoute = Route::has('api.lessons.stream') ? 'api.lessons.stream' : 'lessons.stream';

        $videoUrl = $isPlayable
            ? URL::temporarySignedRoute($streamRoute, now()->addHours(2), ['lesson' => $this->id])
            : null;

        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'description' => $this->description,
            'position' => $this->position,

            // Struktur nested untuk CourseDetail & Player
            'video' => [
                'status' => $status->value,
                'status_label' => $status->label(),
                'original_name' => $this->video_original_name,
                'mime' => $this->video_mime,
                'size' => $this->video_size,
                'error' => $this->video_error,
                'url' => $videoUrl,
            ],

            // Field flat tetap dipertahankan untuk kompatibilitas backward
            'video_status' => $status->value,
            'video_status_label' => $status->label(),
            'has_playable_video' => $isPlayable,
            'video_original_name' => $this->video_original_name,
            'video_mime' => $this->video_mime,
            'video_size' => $this->video_size,
            'video_error' => $this->video_error,
            'video_url' => $videoUrl,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
