import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Play,
    VideoOff,
} from "lucide-react";
import { useDocumentTitle, useFetch } from "../../lib/hooks";
import { ErrorNotice, Loading } from "../../components/ui";

function Player({ lesson }) {
    const [broken, setBroken] = useState(false);
    const url = lesson.video?.url ?? lesson.video_url ?? null;

    return (
        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-sm ring-1 ring-slate-900/10">
            {url && !broken ? (
                <video
                    className="w-full aspect-video max-h-[68vh] bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    src={url}
                    onError={() => setBroken(true)}
                >
                    Browser Anda tidak mendukung pemutar video.
                </video>
            ) : (
                <div
                    role="status"
                    className="aspect-video flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2.5"
                >
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <VideoOff size={28} aria-hidden="true" />
                    </div>
                    <strong className="text-sm sm:text-base font-semibold text-slate-200">
                        {broken
                            ? "Video tidak dapat diputar"
                            : "Video belum tersedia"}
                    </strong>
                    <span className="text-xs sm:text-sm text-slate-400 max-w-md">
                        {broken
                            ? "Muat ulang halaman. Jika masih gagal, hubungi pengajar."
                            : "Pelajaran ini belum memiliki video yang siap ditonton."}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function LessonPlayer() {
    const { courseId, lessonId } = useParams();
    const { data, loading, error, reload } = useFetch(
        `/courses/${courseId}/lessons/${lessonId}`,
    );
    useDocumentTitle(data?.lesson?.title ?? "Pelajaran");

    if (error) {
        return (
            <div className="space-y-4">
                <ErrorNotice
                    error={error}
                    onRetry={error.status === 404 ? undefined : reload}
                />
                <div>
                    <Link
                        to={`/courses/${courseId}`}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        &larr; Kembali ke kursus
                    </Link>
                </div>
            </div>
        );
    }

    if (!data || loading) return <Loading />;

    const {
        course,
        lesson,
        position,
        total,
        previous_id: previousId,
        next_id: nextId,
    } = data;
    const lessonPath = (id) => `/courses/${course.id}/lessons/${id}`;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav
                className="flex items-center gap-1.5 text-sm text-slate-500"
                aria-label="Navigasi"
            >
                <Link
                    to="/courses"
                    className="hover:text-indigo-600 font-medium transition shrink-0"
                >
                    Kursus
                </Link>
                <ChevronRight
                    size={15}
                    className="text-slate-400 shrink-0"
                    aria-hidden="true"
                />
                <Link
                    to={`/courses/${course.id}`}
                    className="hover:text-indigo-600 font-medium transition truncate"
                >
                    {course.title}
                </Link>
                <ChevronRight
                    size={15}
                    className="text-slate-400 shrink-0"
                    aria-hidden="true"
                />
                <span className="text-slate-800 font-medium truncate">
                    {lesson.title}
                </span>
            </nav>

            {/* Grid 2 Kolom: Kiri (Video & Info Materi) & Kanan (Playlist) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] gap-6 items-start">
                <article className="space-y-5">
                    <Player key={lesson.id} lesson={lesson} />

                    {/* Kartu Informasi Pelajaran */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="space-y-1.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                                Pelajaran {position} dari {total}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                {lesson.title}
                            </h1>
                        </div>

                        {lesson.description && (
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-3 border-t border-slate-100 whitespace-pre-line">
                                {lesson.description}
                            </p>
                        )}

                        {/* Navigasi Sebelumnya / Berikutnya */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            {previousId ? (
                                <Link
                                    to={lessonPath(previousId)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Pelajaran sebelumnya</span>
                                </Link>
                            ) : (
                                <span />
                            )}

                            {nextId && (
                                <Link
                                    to={lessonPath(nextId)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition ml-auto"
                                >
                                    <span>Pelajaran berikutnya</span>
                                    <ArrowRight size={16} />
                                </Link>
                            )}
                        </div>
                    </div>
                </article>

                {/* Sidebar Playlist Daftar Pelajaran */}
                <aside
                    aria-label="Daftar pelajaran"
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-3 lg:sticky lg:top-6"
                >
                    <div className="px-1.5 pb-2 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {course.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {total} pelajaran tersedia
                        </p>
                    </div>

                    <ol className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
                        {course.lessons.map((item, index) => {
                            const current = item.id === lesson.id;
                            const playable = Boolean(
                                item.video?.url ?? item.video_url,
                            );

                            const inner = (
                                <>
                                    <span
                                        className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 ${
                                            current
                                                ? "bg-indigo-600 text-white"
                                                : playable
                                                  ? "bg-slate-100 text-slate-700"
                                                  : "bg-slate-100 text-slate-400"
                                        }`}
                                    >
                                        {current ? (
                                            <Play
                                                size={11}
                                                className="fill-white"
                                            />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div
                                            className={`text-sm font-semibold leading-snug line-clamp-2 ${
                                                current
                                                    ? "text-indigo-950"
                                                    : playable
                                                      ? "text-slate-800"
                                                      : "text-slate-400"
                                            }`}
                                        >
                                            {item.title}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                            {playable ? (
                                                <>
                                                    <CheckCircle2
                                                        size={12}
                                                        className="text-emerald-600 shrink-0"
                                                    />
                                                    <span>Video siap</span>
                                                </>
                                            ) : (
                                                <span>Video belum tersedia</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            );

                            return (
                                <li key={item.id}>
                                    {playable || current ? (
                                        <Link
                                            to={lessonPath(item.id)}
                                            aria-current={
                                                current ? "page" : undefined
                                            }
                                            className={`flex items-start gap-3 p-3 rounded-xl transition ${
                                                current
                                                    ? "bg-indigo-50 ring-1 ring-indigo-200"
                                                    : "hover:bg-slate-50"
                                            }`}
                                        >
                                            {inner}
                                        </Link>
                                    ) : (
                                        <div className="flex items-start gap-3 p-3 rounded-xl opacity-60 cursor-not-allowed">
                                            {inner}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </aside>
            </div>
        </div>
    );
}