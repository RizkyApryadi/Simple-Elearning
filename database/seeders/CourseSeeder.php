<?php

namespace Database\Seeders;

use App\Enums\CourseStatus;
use App\Enums\VideoStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $creatorId = User::where('role', 'admin')->value('id') ?? User::query()->value('id');

        if (! $creatorId) {
            return;
        }

        $courses = [
            [
                'title' => 'Dasar Pemrograman Web dengan Laravel',
                'description' => 'Belajar dasar pengembangan aplikasi web dengan PHP dan Laravel mulai dari routing, controller, database, hingga API.',
                'status' => CourseStatus::Published,
                'lessons' => [
                    [
                        'title' => 'Pengenalan MVC & Struktur Folder Laravel',
                        'description' => 'Memahami alur request dan struktur direktori utama pada Laravel.',
                    ],
                    [
                        'title' => 'Routing, Controller, dan Database Migration',
                        'description' => 'Membuat route, controller, dan tabel database menggunakan migration.',
                    ],
                ],
            ],
            [
                'title' => 'Dasar Antarmuka Web dengan React & Tailwind CSS',
                'description' => 'Membuat tampilan aplikasi web modern dan responsif menggunakan komponen React serta utility class Tailwind CSS.',
                'status' => CourseStatus::Published,
                'lessons' => [
                    [
                        'title' => 'Komponen, Props, dan State',
                        'description' => 'Menyusun komponen UI dan mengelola state interaktif di React.',
                    ],
                    [
                        'title' => 'Routing Halaman & Styling Tailwind CSS',
                        'description' => 'Mengatur navigasi halaman dan menata layout responsif dengan Tailwind CSS.',
                    ],
                ],
            ],
            [
                'title' => 'Fundamental Bahasa Pemrograman C',
                'description' => 'Mempelajari logika dasar pemrograman menggunakan bahasa C seperti variabel, percabangan, perulangan, dan array.',
                'status' => CourseStatus::Published,
                'lessons' => [
                    [
                        'title' => 'Variabel, Tipe Data, dan Operator',
                        'description' => 'Mengenal tipe data dasar dan operasi perhitungan pada bahasa C.',
                    ],
                    [
                        'title' => 'Percabangan, Perulangan, dan Array',
                        'description' => 'Mengatur alur logika program serta mengelola data array.',
                    ],
                ],
            ],
        ];

        foreach ($courses as $courseData) {
            $course = Course::updateOrCreate(
                ['slug' => Str::slug($courseData['title'])],
                [
                    'created_by' => $creatorId,
                    'title' => $courseData['title'],
                    'description' => $courseData['description'],
                    'status' => $courseData['status'],
                ]
            );

            foreach ($courseData['lessons'] as $index => $lessonData) {
                $course->lessons()->updateOrCreate(
                    ['position' => $index + 1],
                    [
                        'title' => $lessonData['title'],
                        'description' => $lessonData['description'],
                        'video_status' => VideoStatus::None,
                        'video_path' => null,
                    ]
                );
            }
        }
    }
}
