import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    GripVertical,
    ImagePlus,
    ListVideo,
    Pencil,
    Play,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { api } from "../../lib/api";
import { formatBytes, moveItem } from "../../lib/format";
import { useDebounced, useDocumentTitle, useFetch } from "../../lib/hooks";
import { ConfirmDialog, Modal } from "../../components/Modal";
import { useToast } from "../../components/Toast";
import {
    CourseStatusBadge,
    EmptyState,
    ErrorNotice,
    Field,
    Loading,
    Spinner,
    VideoStatusBadge,
} from "../../components/ui";
import LessonModal from "./LessonModal";

const LESSONS_PER_PAGE = 7;

/* =========================================================
   Helpers
========================================================= */

function normalizeVideo(lesson) {
    const status = lesson.video?.status ?? lesson.video_status ?? "none";

    return {
        status,
        status_label:
            lesson.video?.status_label ??
            lesson.video_status_label ??
            "Belum ada video",
        url:
            lesson.video?.url ??
            lesson.video_url ??
            (status === "ready" ? `/api/lessons/${lesson.id}/stream` : null),
        original_name:
            lesson.video?.original_name ?? lesson.video_original_name ?? null,
        size: lesson.video?.size ?? lesson.video_size ?? null,
        error: lesson.video?.error ?? lesson.video_error ?? null,
    };
}

function resolveThumbnailUrl(course) {
    if (course.thumbnail_url) return course.thumbnail_url;

    if (course.thumbnail) {
        return course.thumbnail.startsWith("http")
            ? course.thumbnail
            : `/storage/${course.thumbnail}`;
    }

    return null;
}

/* =========================================================
   Course Information Panel
========================================================= */

function CourseInfoPanel({ course, onSaved, onDelete }) {
    const toast = useToast();

    const initial = {
        title: course.title,
        description: course.description ?? "",
        status: course.status,
    };

    const [form, setForm] = useState(initial);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const fileInputRef = useRef(null);

    const existingThumbnail = resolveThumbnailUrl(course);
    const currentPreview = thumbnailPreview || existingThumbnail;

    const dirty =
        Object.keys(initial).some((key) => initial[key] !== form[key]) ||
        Boolean(thumbnailFile);

    const set = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    function handleFileChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
        }

        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
        setErrors((prev) => ({
            ...prev,
            thumbnail: undefined,
        }));
    }

    function clearSelectedFile(event) {
        event?.stopPropagation();

        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
        }

        setThumbnailFile(null);
        setThumbnailPreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    useEffect(() => {
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    async function submit(event) {
        event.preventDefault();

        if (!dirty || busy) return;

        setBusy(true);
        setErrors({});

        try {
            let saved;

            if (thumbnailFile) {
                const payload = new FormData();

                payload.append("_method", "PUT");
                payload.append("title", form.title);
                payload.append("description", form.description);
                payload.append("status", form.status);
                payload.append("thumbnail", thumbnailFile);

                saved = await api.post(`/admin/courses/${course.id}`, payload);
            } else {
                saved = await api.put(`/admin/courses/${course.id}`, form);
            }

            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }

            setThumbnailFile(null);
            setThumbnailPreview(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            onSaved(saved);
            toast.success("Perubahan berhasil disimpan.");
        } catch (error) {
            setErrors(error.errors ?? {});

            toast.error(
                error.status === 422
                    ? "Periksa kembali isian yang ditandai."
                    : error.message,
            );
        } finally {
            setBusy(false);
        }
    }

    const inputBase =
        "w-full rounded-xl border bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2";

    const inputNormal =
        "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15";

    const inputError =
        "border-red-300 focus:border-red-500 focus:ring-red-500/15";

    return (
        <form
            onSubmit={submit}
            noValidate
            className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
        >
            {/* Panel Header */}
            <div className="mb-2.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Informasi kursus
                </h2>
                <p className="text-[11px] text-slate-500">
                    Atur detail dan tampilan kursus.
                </p>
            </div>

            {/* Thumbnail */}
            <Field
                id="info-thumbnail"
                label="Thumbnail kursus"
                error={errors.thumbnail?.[0]}
                hint="JPG, PNG, atau WebP · Maks. 2 MB"
            >
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden text-left"
                        aria-label="Pilih thumbnail kursus"
                    >
                        {currentPreview ? (
                            <>
                                <img
                                    src={currentPreview}
                                    alt={form.title || "Thumbnail kursus"}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                />

                                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

                                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                                    <ImagePlus size={12} />
                                    <span>Ganti</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 px-3 text-center">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 shadow-2xs ring-1 ring-slate-200">
                                    <ImagePlus size={15} />
                                </div>
                                <p className="text-xs font-medium text-slate-600">
                                    Pilih thumbnail
                                </p>
                            </div>
                        )}
                    </button>

                    {thumbnailFile && (
                        <button
                            type="button"
                            onClick={clearSelectedFile}
                            title="Batalkan thumbnail baru"
                            aria-label="Batalkan thumbnail baru"
                            className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-black/70 text-white shadow-2xs transition hover:bg-red-600"
                        >
                            <X size={13} />
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        id="info-thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </Field>

            {/* Title */}
            <div className="mt-2.5">
                <Field
                    id="info-title"
                    label="Judul kursus"
                    error={errors.title?.[0]}
                >
                    <input
                        id="info-title"
                        value={form.title}
                        onChange={set("title")}
                        maxLength={200}
                        aria-invalid={Boolean(errors.title)}
                        placeholder="Masukkan judul kursus"
                        className={`${inputBase} ${errors.title ? inputError : inputNormal}`}
                    />
                </Field>
            </div>

            {/* Description */}
            <div className="mt-2">
                <Field
                    id="info-description"
                    label="Deskripsi"
                    error={errors.description?.[0]}
                >
                    <textarea
                        id="info-description"
                        rows={2}
                        value={form.description}
                        onChange={set("description")}
                        aria-invalid={Boolean(errors.description)}
                        placeholder="Jelaskan isi kursus..."
                        className={`${inputBase} min-h-[46px] resize-y ${errors.description ? inputError : inputNormal}`}
                    />
                </Field>
            </div>

            {/* Status */}
            <div className="mt-2">
                <Field
                    id="info-status"
                    label="Status kursus"
                    error={errors.status?.[0]}
                    hint="Hanya kursus Terbit yang tampil ke siswa."
                >
                    <select
                        id="info-status"
                        value={form.status}
                        onChange={set("status")}
                        aria-invalid={Boolean(errors.status)}
                        className={`${inputBase} cursor-pointer ${errors.status ? inputError : inputNormal}`}
                    >
                        <option value="draft">Draf</option>
                        <option value="published">Terbit</option>
                    </select>
                </Field>
            </div>

            {/* Actions */}
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 pt-2.5">
                <button
                    type="submit"
                    disabled={!dirty || busy}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {busy && <Spinner size={14} />}
                    <span>{busy ? "Menyimpan..." : "Simpan"}</span>
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    title="Hapus kursus"
                    aria-label="Hapus kursus"
                    className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50"
                >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                </button>
            </div>
        </form>
    );
}

/* =========================================================
   Lesson Card (Ringkas 1 baris di desktop)
========================================================= */

function LessonCard({
    lesson,
    index,
    total,
    video,
    isDragging,
    isOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onMove,
    onPreview,
    onEdit,
    onDelete,
}) {
    return (
        <li
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`group rounded-xl border bg-white px-3.5 py-2.5 transition-all ${
                isDragging
                    ? "border-indigo-400 bg-indigo-50/50 opacity-50"
                    : isOver
                      ? "border-indigo-500 ring-2 ring-indigo-500/10"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-2xs"
            }`}
        >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                {/* Left: Drag + Number + Title + Inline Meta */}
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div
                        className="flex shrink-0 cursor-grab items-center justify-center text-slate-300 transition hover:text-slate-500 active:cursor-grabbing"
                        title="Drag untuk mengubah urutan"
                    >
                        <GripVertical size={16} />
                    </div>

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            {video.url ? (
                                <button
                                    type="button"
                                    onClick={onPreview}
                                    className="cursor-pointer truncate text-left text-sm font-semibold text-slate-900 transition hover:text-indigo-600"
                                    title={lesson.title}
                                >
                                    {lesson.title}
                                </button>
                            ) : (
                                <p
                                    className="truncate text-sm font-semibold text-slate-900"
                                    title={lesson.title}
                                >
                                    {lesson.title}
                                </p>
                            )}

                            <VideoStatusBadge video={video} />

                            {video.status === "ready" && (
                                <span className="hidden truncate text-xs text-slate-400 md:inline">
                                    {video.original_name}
                                    {video.size != null
                                        ? ` · ${formatBytes(video.size)}`
                                        : ""}
                                </span>
                            )}
                        </div>

                        {video.status === "failed" && video.error && (
                            <p className="mt-0.5 truncate text-xs font-medium text-red-600">
                                {video.error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Reorder + Main Actions */}
                <div className="flex shrink-0 items-center justify-end gap-1 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
                    <button
                        type="button"
                        aria-label={`Naikkan ${lesson.title}`}
                        title="Naikkan urutan"
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
                    >
                        <ChevronUp size={15} />
                    </button>

                    <button
                        type="button"
                        aria-label={`Turunkan ${lesson.title}`}
                        title="Turunkan urutan"
                        disabled={index === total - 1}
                        onClick={() => onMove(1)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
                    >
                        <ChevronDown size={15} />
                    </button>

                    {video.url && (
                        <button
                            type="button"
                            onClick={onPreview}
                            className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                            <Play size={12} className="fill-indigo-600" />
                            <span>Tonton</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        <Pencil size={12} />
                        <span>Edit</span>
                    </button>

                    <button
                        type="button"
                        aria-label={`Hapus ${lesson.title}`}
                        title="Hapus pelajaran"
                        onClick={onDelete}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </li>
    );
}

/* =========================================================
   Main Course Detail
========================================================= */

export default function CourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const {
        data: course,
        loading,
        error,
        reload,
        setData,
    } = useFetch(`/admin/courses/${courseId}`);

    useDocumentTitle(course?.title ?? "Kelola kursus");

    const [modal, setModal] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [overId, setOverId] = useState(null);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const dragIdRef = useRef(null);
    const prevLessonsCountRef = useRef(null);

    const debouncedSearch = useDebounced(searchQuery, 250);
    const normalizedQuery = debouncedSearch.trim().toLowerCase();

    const lessons = course?.lessons ?? [];

    const indexedLessons = useMemo(
        () => lessons.map((lesson, idx) => ({ lesson, originalIndex: idx })),
        [lessons],
    );

    const filteredLessons = useMemo(() => {
        if (!normalizedQuery) return indexedLessons;

        return indexedLessons.filter(({ lesson }) => {
            const title = (lesson.title ?? "").toLowerCase();
            const description = (lesson.description ?? "").toLowerCase();
            const videoName = (
                lesson.video?.original_name ??
                lesson.video_original_name ??
                ""
            ).toLowerCase();

            return (
                title.includes(normalizedQuery) ||
                description.includes(normalizedQuery) ||
                videoName.includes(normalizedQuery)
            );
        });
    }, [indexedLessons, normalizedQuery]);

    useEffect(() => {
        setPage(1);
    }, [normalizedQuery]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredLessons.length / LESSONS_PER_PAGE),
    );
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * LESSONS_PER_PAGE;

    const visibleLessons = useMemo(
        () => filteredLessons.slice(startIndex, startIndex + LESSONS_PER_PAGE),
        [filteredLessons, startIndex],
    );

    useEffect(() => {
        if (
            prevLessonsCountRef.current !== null &&
            lessons.length > prevLessonsCountRef.current
        ) {
            setPage(Math.max(1, Math.ceil(lessons.length / LESSONS_PER_PAGE)));
        }
        prevLessonsCountRef.current = lessons.length;
    }, [lessons.length]);

    if (error) {
        return (
            <div className="space-y-4">
                <ErrorNotice error={error} onRetry={reload} />

                <Link
                    to="/admin/courses"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                >
                    &larr; Kembali ke daftar kursus
                </Link>
            </div>
        );
    }

    if (!course) return <Loading />;

    const totalLessonsCount =
        course.lesson_count ?? course.lessons_count ?? lessons.length;

    const readyLessonsCount =
        course.ready_lessons_count ??
        lessons.filter(
            (lesson) => (lesson.video?.status ?? lesson.video_status) === "ready",
        ).length;

    function handleCourseSaved(saved) {
        setData((prev) => ({
            ...prev,
            ...saved,
            lessons: saved.lessons ?? prev?.lessons ?? [],
            lesson_count:
                saved.lesson_count ??
                saved.lessons_count ??
                saved.lessons?.length ??
                prev?.lesson_count ??
                prev?.lessons_count ??
                0,
            ready_lessons_count:
                saved.ready_lessons_count ?? prev?.ready_lessons_count ?? 0,
        }));
    }

    /* -----------------------------------------------------
       Reorder
    ----------------------------------------------------- */

    async function persistOrder(next) {
        const previous = lessons;

        setData((c) => ({
            ...c,
            lessons: next.map((lesson, index) => ({
                ...lesson,
                position: index + 1,
            })),
        }));

        try {
            await api.put(`/admin/courses/${course.id}/lessons/reorder`, {
                ids: next.map((lesson) => lesson.id),
            });

            toast.success("Urutan pelajaran diperbarui.");
        } catch (err) {
            setData((c) => ({
                ...c,
                lessons: previous,
            }));

            toast.error(err.message);
        }
    }

    const moveBy = (index, delta) => {
        const targetIndex = index + delta;

        if (targetIndex < 0 || targetIndex >= lessons.length) {
            return;
        }

        persistOrder(moveItem(lessons, index, targetIndex));
    };

    function handleDrop(targetId, fallbackDraggedId = null) {
        const dragged = dragIdRef.current ?? fallbackDraggedId ?? null;

        const from = lessons.findIndex(
            (lesson) => Number(lesson.id) === Number(dragged),
        );

        const to = lessons.findIndex(
            (lesson) => Number(lesson.id) === Number(targetId),
        );

        dragIdRef.current = null;
        setDragId(null);
        setOverId(null);

        if (from === -1 || to === -1 || from === to) return;

        persistOrder(moveItem(lessons, from, to));
    }

    /* -----------------------------------------------------
       Delete
    ----------------------------------------------------- */

    async function deleteLesson(lesson) {
        try {
            await api.delete(`/admin/lessons/${lesson.id}`);

            toast.success("Pelajaran berhasil dihapus.");
            reload();
        } catch (err) {
            toast.error(err.message);
        }

        setModal(null);
    }

    async function deleteCourse() {
        try {
            await api.delete(`/admin/courses/${course.id}`);

            toast.success("Kursus berhasil dihapus.");

            navigate("/admin/courses", {
                replace: true,
            });
        } catch (err) {
            toast.error(err.message);
            setModal(null);
        }
    }

    /* -----------------------------------------------------
       Preview navigation
    ----------------------------------------------------- */

    const previewIndex =
        modal?.type === "preview"
            ? lessons.findIndex(
                  (item) => Number(item.id) === Number(modal.lesson.id),
              )
            : -1;

    const prevPreviewLesson =
        previewIndex > 0 ? lessons[previewIndex - 1] : null;

    const nextPreviewLesson =
        previewIndex !== -1 && previewIndex < lessons.length - 1
            ? lessons[previewIndex + 1]
            : null;

    function openPreview(lesson) {
        setModal({
            type: "preview",
            lesson: {
                ...lesson,
                video: normalizeVideo(lesson),
            },
        });
    }

    /* =====================================================
       Render
    ===================================================== */

    return (
        <div
            className={`mx-auto w-full max-w-[1600px] space-y-4 pb-6 transition-opacity ${
                loading ? "opacity-70" : "opacity-100"
            }`}
        >
            {/* Breadcrumb */}
            <nav
                className="flex min-w-0 items-center gap-2 text-xs sm:text-sm"
                aria-label="Navigasi"
            >
                <Link
                    to="/admin/courses"
                    className="shrink-0 font-medium text-slate-500 transition hover:text-indigo-600"
                >
                    Kursus
                </Link>

                <ChevronRight
                    size={15}
                    className="shrink-0 text-slate-400"
                    aria-hidden="true"
                />

                <span
                    className="truncate font-medium text-slate-800"
                    title={course.title}
                >
                    {course.title}
                </span>
            </nav>

            {/* Course Header */}
            <header className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="break-words text-xl font-bold tracking-tight text-slate-900">
                            {course.title}
                        </h1>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                                <ListVideo size={14} />
                                {totalLessonsCount} pelajaran
                            </span>

                            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                            <span>{readyLessonsCount} video siap</span>
                        </div>
                    </div>

                    <div className="flex shrink-0">
                        <CourseStatusBadge
                            status={course.status}
                            label={course.status_label}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content: Kiri Tetap (Sticky), Kanan Konten Pelajaran */}
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
                {/* Course Info (Tetap diam saat scroll) */}
                <aside className="min-w-0 xl:sticky xl:top-5">
                    <CourseInfoPanel
                        key={`${course.updated_at}-${course.thumbnail ?? ""}`}
                        course={course}
                        onSaved={handleCourseSaved}
                        onDelete={() =>
                            setModal({
                                type: "delete-course",
                            })
                        }
                    />
                </aside>

                {/* Lessons */}
                <section
                    aria-labelledby="lessons-heading"
                    className="min-w-0 space-y-3"
                >
                    {/* Section Header */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between sm:px-5">
                        <div>
                            <h2
                                id="lessons-heading"
                                className="text-base font-bold text-slate-900"
                            >
                                Daftar pelajaran
                            </h2>

                            <p className="text-xs text-slate-500">
                                Geser baris atau gunakan tombol panah untuk
                                mengatur urutan.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {lessons.length > 0 && (
                                <div className="relative min-w-[220px]">
                                    <Search
                                        size={15}
                                        aria-hidden="true"
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        placeholder="Cari pelajaran..."
                                        aria-label="Cari pelajaran"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            aria-label="Hapus pencarian"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setModal({
                                        type: "lesson",
                                    })
                                }
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800 sm:w-auto"
                            >
                                <Plus size={16} />
                                <span>Tambah pelajaran</span>
                            </button>
                        </div>
                    </div>

                    {/* Empty State */}
                    {lessons.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                            <EmptyState
                                icon={ListVideo}
                                title="Belum ada pelajaran"
                                action={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setModal({
                                                type: "lesson",
                                            })
                                        }
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        <Plus size={17} />
                                        <span>Tambah pelajaran</span>
                                    </button>
                                }
                            >
                                Tambahkan pelajaran pertama, lalu unggah video
                                materinya.
                            </EmptyState>
                        </div>
                    ) : filteredLessons.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                            <p className="text-sm font-semibold text-slate-800">
                                Tidak ada pelajaran yang cocok dengan &ldquo;
                                {searchQuery.trim()}&rdquo;
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Coba kata kunci lain atau bersihkan pencarian.
                            </p>
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="mt-3 inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Reset pencarian
                            </button>
                        </div>
                    ) : (
                        <>
                            <ol className="space-y-2">
                                {visibleLessons.map(
                                    ({ lesson, originalIndex }) => {
                                        const isDragging = dragId === lesson.id;
                                        const isOver =
                                            overId === lesson.id &&
                                            dragId !== lesson.id;

                                        const video = normalizeVideo(lesson);

                                        return (
                                            <LessonCard
                                                key={lesson.id}
                                                lesson={lesson}
                                                index={originalIndex}
                                                total={lessons.length}
                                                video={video}
                                                isDragging={isDragging}
                                                isOver={isOver}
                                                onDragStart={(event) => {
                                                    dragIdRef.current =
                                                        lesson.id;

                                                    event.dataTransfer.effectAllowed =
                                                        "move";

                                                    event.dataTransfer.setData(
                                                        "text/plain",
                                                        String(lesson.id),
                                                    );

                                                    requestAnimationFrame(() =>
                                                        setDragId(lesson.id),
                                                    );
                                                }}
                                                onDragOver={(event) => {
                                                    event.preventDefault();

                                                    event.dataTransfer.dropEffect =
                                                        "move";

                                                    if (overId !== lesson.id) {
                                                        setOverId(lesson.id);
                                                    }
                                                }}
                                                onDrop={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();

                                                    const raw =
                                                        event.dataTransfer.getData(
                                                            "text/plain",
                                                        );

                                                    handleDrop(
                                                        lesson.id,
                                                        raw ? Number(raw) : null,
                                                    );
                                                }}
                                                onDragEnd={() => {
                                                    dragIdRef.current = null;
                                                    setDragId(null);
                                                    setOverId(null);
                                                }}
                                                onMove={(delta) =>
                                                    moveBy(originalIndex, delta)
                                                }
                                                onPreview={() =>
                                                    openPreview(lesson)
                                                }
                                                onEdit={() =>
                                                    setModal({
                                                        type: "lesson",
                                                        lesson: {
                                                            ...lesson,
                                                            video,
                                                        },
                                                    })
                                                }
                                                onDelete={() =>
                                                    setModal({
                                                        type: "delete-lesson",
                                                        lesson,
                                                    })
                                                }
                                            />
                                        );
                                    },
                                )}
                            </ol>

                            {totalPages > 1 && (
                                <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Menampilkan{" "}
                                        <strong className="font-semibold text-slate-800">
                                            {startIndex + 1}–
                                            {Math.min(
                                                startIndex + LESSONS_PER_PAGE,
                                                filteredLessons.length,
                                            )}
                                        </strong>{" "}
                                        dari{" "}
                                        <strong className="font-semibold text-slate-800">
                                            {filteredLessons.length}
                                        </strong>{" "}
                                        pelajaran
                                    </span>

                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            type="button"
                                            disabled={safePage <= 1}
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
                                        >
                                            <ChevronLeft size={14} />
                                            <span>Sebelumnya</span>
                                        </button>

                                        <span className="px-2 font-semibold text-slate-800">
                                            {safePage} / {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={safePage >= totalPages}
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
                                        >
                                            <span>Selanjutnya</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* =====================================================
               Lesson Modal
            ===================================================== */}

            {modal?.type === "lesson" && (
                <LessonModal
                    key={modal.lesson?.id ?? "new"}
                    course={course}
                    lesson={modal.lesson}
                    onClose={() => setModal(null)}
                    onChanged={reload}
                />
            )}

            {/* =====================================================
               Video Preview
            ===================================================== */}

            {modal?.type === "preview" && (
                <Modal
                    title={
                        previewIndex !== -1
                            ? `${previewIndex + 1}. ${modal.lesson.title}`
                            : modal.lesson.title
                    }
                    wide
                    onClose={() => setModal(null)}
                >
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-xl bg-black ring-1 ring-slate-900/10">
                            <video
                                key={modal.lesson.id}
                                className="aspect-video max-h-[65vh] w-full"
                                src={modal.lesson.video?.url}
                                controls
                                autoPlay
                                playsInline
                                preload="metadata"
                            />
                        </div>

                        {modal.lesson.description && (
                            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-600">
                                {modal.lesson.description}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                {modal.lesson.video?.original_name && (
                                    <p
                                        className="truncate text-xs text-slate-500"
                                        title={modal.lesson.video.original_name}
                                    >
                                        {modal.lesson.video.original_name}
                                        {modal.lesson.video.size
                                            ? ` · ${formatBytes(modal.lesson.video.size)}`
                                            : ""}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                <button
                                    type="button"
                                    disabled={!prevPreviewLesson}
                                    onClick={() =>
                                        prevPreviewLesson &&
                                        openPreview(prevPreviewLesson)
                                    }
                                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
                                >
                                    &larr; Sebelumnya
                                </button>

                                <button
                                    type="button"
                                    disabled={!nextPreviewLesson}
                                    onClick={() =>
                                        nextPreviewLesson &&
                                        openPreview(nextPreviewLesson)
                                    }
                                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
                                >
                                    Selanjutnya &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* =====================================================
               Delete Lesson
            ===================================================== */}

            {modal?.type === "delete-lesson" && (
                <ConfirmDialog
                    title="Hapus pelajaran?"
                    message={`Pelajaran "${modal.lesson.title}" dan videonya akan dihapus permanen.`}
                    confirmLabel="Hapus pelajaran"
                    onCancel={() => setModal(null)}
                    onConfirm={() => deleteLesson(modal.lesson)}
                />
            )}

            {/* =====================================================
               Delete Course
            ===================================================== */}

            {modal?.type === "delete-course" && (
                <ConfirmDialog
                    title="Hapus kursus?"
                    message={`Kursus "${course.title}" beserta ${totalLessonsCount} pelajaran dan seluruh videonya akan dihapus permanen.`}
                    confirmLabel="Hapus kursus"
                    onCancel={() => setModal(null)}
                    onConfirm={deleteCourse}
                />
            )}
        </div>
    );
}