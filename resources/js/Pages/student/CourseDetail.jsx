import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Clock,
    ListVideo,
    Play,
    Sparkles,
    VideoOff,
} from "lucide-react";
import { useDocumentTitle, useFetch } from "../../lib/hooks";
import { CourseCover, ErrorNotice, Loading } from "../../components/ui";

const LESSONS_PER_PAGE = 7;

export default function CourseDetail() {
    const { courseId } = useParams();
    const { data: course, error, reload } = useFetch(`/courses/${courseId}`);
    useDocumentTitle(course?.title ?? "Detail Kursus");

    const [page, setPage] = useState(1);

    const lessons = course?.lessons ?? [];

    const totalPages = Math.max(1, Math.ceil(lessons.length / LESSONS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * LESSONS_PER_PAGE;

    const visibleLessons = useMemo(
        () => lessons.slice(startIndex, startIndex + LESSONS_PER_PAGE),
        [lessons, startIndex],
    );

    useEffect(() => {
        setPage(1);
    }, [courseId]);

    if (error) {
        return (
            <div className="space-y-4">
                <ErrorNotice
                    error={error}
                    onRetry={error.status === 404 ? undefined : reload}
                />
                <div>
                    <Link
                        to="/courses"
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        &larr; Kembali ke daftar kursus
                    </Link>
                </div>
            </div>
        );
    }

    if (!course) return <Loading />;

    const courseSlug = course.slug || course.id;

    const totalLessonsCount =
        course.lesson_count ?? course.lessons_count ?? lessons.length;

    const playableLessons = lessons.filter((lesson) =>
        Boolean(lesson.video?.url ?? lesson.video_url),
    );
    const firstPlayable = playableLessons[0];

    function goToPage(nextPage) {
        const clamped = Math.min(Math.max(1, nextPage), totalPages);
        setPage(clamped);
        document
            .getElementById("syllabus-heading")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div className="space-y-8">
            {/* Keyframe animasi lokal */}
            <style>{`
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(2deg); }
                }
                @keyframes shimmerSweep {
                    0% { transform: translateX(-120%); }
                    100% { transform: translateX(220%); }
                }
                @keyframes fadeSlideUp {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-float-slow {
                    animation: floatSlow 3.2s ease-in-out infinite;
                }
                .animate-shimmer-sweep {
                    animation: shimmerSweep 2.6s ease-in-out infinite;
                }
                .animate-fade-slide-up {
                    animation: fadeSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
            `}</style>

            {/* Breadcrumb */}
            <nav
                className="flex items-center gap-1.5 text-sm text-slate-500"
                aria-label="Navigasi"
            >
                <Link
                    to="/courses"
                    className="hover:text-indigo-600 font-medium transition"
                >
                    Kursus
                </Link>
                <ChevronRight
                    size={15}
                    className="text-slate-400 shrink-0"
                    aria-hidden="true"
                />
                <span className="text-slate-800 font-medium truncate">
                    {course.title}
                </span>
            </nav>

            {/* Hero / Ringkasan Kursus */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
                    {/* Cover */}
                    <div className="relative bg-slate-100 flex items-stretch">
                        <CourseCover course={course} large />
                    </div>

                    {/* Informasi Kursus & CTA */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                                    <BookOpen size={13} />
                                    <span>{totalLessonsCount} Pelajaran</span>
                                </span>

                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                                    <Play
                                        size={12}
                                        className="fill-emerald-600"
                                    />
                                    <span>
                                        {playableLessons.length} Video Siap
                                    </span>
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                {course.title}
                            </h1>

                            {course.description ? (
                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                                    {course.description}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">
                                    Tidak ada deskripsi tambahan untuk kursus
                                    ini.
                                </p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                            {firstPlayable ? (
                                <Link
                                    to={`/courses/${courseSlug}/lessons/${firstPlayable.id}`}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition"
                                >
                                    <Play size={16} className="fill-white" />
                                    <span>Mulai belajar</span>
                                </Link>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-sm font-medium">
                                    <Clock size={16} className="shrink-0" />
                                    <span>
                                        Video untuk kursus ini belum tersedia.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Daftar Pelajaran / Silabus */}
            <section aria-labelledby="syllabus-heading" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2
                            id="syllabus-heading"
                            className="text-lg font-bold tracking-tight text-slate-900"
                        >
                            Daftar Pelajaran
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Pilih materi di bawah untuk langsung memutar video
                            pembelajaran.
                        </p>
                    </div>

                    {lessons.length > LESSONS_PER_PAGE && (
                        <span className="text-xs font-medium text-slate-500">
                            Menampilkan {startIndex + 1}–
                            {Math.min(
                                startIndex + LESSONS_PER_PAGE,
                                lessons.length,
                            )}{" "}
                            dari {lessons.length} pelajaran
                        </span>
                    )}
                </div>

                {lessons.length === 0 ? (
                    <div className="animate-fade-slide-up relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/70 p-8 sm:p-10 text-center shadow-xs">
                        {/* Efek cahaya latar */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl animate-pulse"
                        />

                        {/* Sapuan kilau */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer-sweep"
                        />

                        <div className="relative z-10 mx-auto max-w-md space-y-4">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25 animate-float-slow">
                                <ListVideo size={28} />
                            </div>

                            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                                <Sparkles size={12} className="animate-spin" style={{ animationDuration: "6s" }} />
                                <span>Materi Segera Hadir</span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                                Belum ada pelajaran
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Pelajaran akan muncul di sini setelah
                                ditambahkan oleh admin.
                            </p>

                            {/* Indikator antrean materi */}
                            <div className="pt-2 flex items-center justify-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.2s]" />
                                <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.1s]" />
                                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <ol className="space-y-2.5">
                            {visibleLessons.map((lesson, index) => {
                                const lessonNumber = startIndex + index + 1;
                                const hasVideo = Boolean(
                                    lesson.video?.url ?? lesson.video_url,
                                );

                                const content = (
                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                            <span
                                                className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold shrink-0 transition ${
                                                    hasVideo
                                                        ? "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white"
                                                        : "bg-slate-100 text-slate-400"
                                                }`}
                                            >
                                                {lessonNumber}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className={`text-sm font-semibold truncate transition ${
                                                        hasVideo
                                                            ? "text-slate-900 group-hover:text-indigo-600"
                                                            : "text-slate-500"
                                                    }`}
                                                >
                                                    {lesson.title}
                                                </h3>
                                                {lesson.description && (
                                                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                                        {lesson.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {hasVideo ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white text-xs font-semibold transition">
                                                    <Play
                                                        size={13}
                                                        className="fill-current"
                                                    />
                                                    <span>Tonton</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                                                    <VideoOff size={13} />
                                                    <span>Belum tersedia</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );

                                return (
                                    <li
                                        key={lesson.id}
                                        style={{
                                            animationDelay: `${index * 45}ms`,
                                        }}
                                        className="animate-fade-slide-up"
                                    >
                                        {hasVideo ? (
                                            <Link
                                                to={`/courses/${courseSlug}/lessons/${lesson.id}`}
                                                className="group flex items-center p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-indigo-300 hover:shadow-sm transition"
                                            >
                                                {content}
                                            </Link>
                                        ) : (
                                            <div className="flex items-center p-4 rounded-2xl border border-slate-200/60 bg-slate-50/70 opacity-75">
                                                {content}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>

                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs sm:text-sm text-slate-600 shadow-2xs">
                                <span>
                                    Halaman{" "}
                                    <strong className="font-semibold text-slate-900">
                                        {safePage}
                                    </strong>{" "}
                                    dari{" "}
                                    <strong className="font-semibold text-slate-900">
                                        {totalPages}
                                    </strong>
                                </span>

                                <div className="flex items-center justify-end gap-1.5">
                                    <button
                                        type="button"
                                        disabled={safePage <= 1}
                                        onClick={() => goToPage(safePage - 1)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                                    >
                                        <ChevronLeft size={15} />
                                        <span>Sebelumnya</span>
                                    </button>

                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from(
                                            { length: totalPages },
                                            (_, idx) => idx + 1,
                                        ).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                onClick={() => goToPage(pageNum)}
                                                aria-current={
                                                    pageNum === safePage
                                                        ? "page"
                                                        : undefined
                                                }
                                                className={`w-8 h-8 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                                    pageNum === safePage
                                                        ? "bg-indigo-600 text-white shadow-2xs"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={safePage >= totalPages}
                                        onClick={() => goToPage(safePage + 1)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                                    >
                                        <span>Selanjutnya</span>
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}