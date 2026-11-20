<?php

namespace App\Models;

use App\Enums\VideoStatus;
use App\Services\LessonVideoService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'position',
        'video_status', 
        'video_path',
        'video_original_name',
        'video_mime',
        'video_size',
        'video_error',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'video_size' => 'integer',
            'video_status' => VideoStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::deleted(function (Lesson $lesson): void {
            app(LessonVideoService::class)->deleteFileIfExists($lesson->video_path);
        });
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('position')->orderBy('id');
    }

    public function hasPlayableVideo(): bool
    {
        return $this->video_status === VideoStatus::Ready && filled($this->video_path);
    }
}
