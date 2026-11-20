<?php

namespace App\Policies;

use App\Models\Lesson;
use App\Models\User;
use App\Enums\VideoStatus;
use App\Enums\CourseStatus;

use Illuminate\Auth\Access\Response;

class LessonPolicy
{
    /**
     * Cek user boleh menonton video Lesson
     */
    public function stream(User $user, Lesson $lesson): bool
    {
        if ($lesson->video_status !== VideoStatus::Ready || empty($lesson->video_path)){
            return False;
        }

        if ($user->isAdmin()){
            return true;
        }
        
        return $user->isStudent()
        && $lesson->course !== null
        && $lesson->course->status === CourseStatus::Published;
    }

    /**
     * Cek user boleh melihat halaman detail Lesson
     */

    public function view(User $user, Lesson $lesson):bool
    {
        if ($user->isAdmin()){
            return true;
        }
        
        return $user->isStudent()
        && $lesson->course !== null
        && $lesson->course->status === CourseStatus::Published;
    }
}
