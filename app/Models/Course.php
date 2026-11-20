<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'slug',
        'description',
        'thumbnail',
        'status',
    ];

    protected static function booted(): void
    {
        static::creating(function (Course $course): void {
            if (empty($course->slug)) {
                $course->slug = static::generateUniqueSlug($course->title);
            }
        });

        static::updating(function (Course $course): void {
            if ($course->isDirty('title') && ! $course->isDirty('slug')) {
                $course->slug = static::generateUniqueSlug($course->title, $course->id);
            }
        });

        static::deleting(function (Course $course): void {
            $course->lessons()->get()->each->delete();

            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }
        });
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
    }

    public function readyLessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->where('video_status', 'ready');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $like = '%' . addcslashes($term, '%_\\') . '%';

        return $query->where(function (Builder $q) use ($like) {
            $q->where('title', 'like', $like)->orWhere('description', 'like', $like);
        });
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    private static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 1;

        while (
            static::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
    
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if ($field) {
            return $this->where($field, $value)->first();
        }

        return $this->where('slug', $value)
            ->when(ctype_digit((string) $value), fn($q) => $q->orWhere('id', (int) $value))
            ->first();
    }
}
