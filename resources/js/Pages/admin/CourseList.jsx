import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Image as ImageIcon,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from "lucide-react";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useDebounced, useDocumentTitle, useFetch } from "../../lib/hooks";
import { ConfirmDialog } from "../../components/Modal";
import { useToast } from "../../components/Toast";
import {
    CourseStatusBadge,
    ErrorNotice,
    Loading,
    Pagination,
} from "../../components/ui";
import CourseFormModal from "./CourseFormModal";

function resolveThumbnailUrl(course) {
    if (!course) return null;
    if (course.thumbnail_url) return course.thumbnail_url;
    if (course.thumbnail) {
        return course.thumbnail.startsWith("http")
            ? course.thumbnail
            : `/storage/${course.thumbnail}`;
    }
    return null;
}

function getLessonsCount(course) {
    return (
        course.lesson_count ??
        course.lessons_count ??
        course.total_lessons ??
        (Array.isArray(course.lessons) ? course.lessons.length : 0)
    );
}

function getReadyLessonsCount(course) {
    return (
        course.ready_lessons_count ??
        course.ready_lesson_count ??
        (Array.isArray(course.lessons)
            ? course.lessons.filter(
                  (lesson) =>
                      (lesson.video?.status ?? lesson.video_status) === "ready",
              ).length
            : 0)
    );
}
function EmptyCharacterIllustration({ variant = "empty" }) {
    const isSearchEmpty = variant === "search";

    return (
        <div
            className="relative mx-auto w-44 h-36 select-none"
            aria-hidden="true"
        >
            <style>{`
                @keyframes charFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes charShadow {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(0.86); opacity: 0.55; }
                }
                @keyframes charWave {
                    0%, 100% { transform: rotate(0deg); }
                    30% { transform: rotate(-14deg); }
                    60% { transform: rotate(8deg); }
                }
                @keyframes charSearch {
                    0%, 100% { transform: rotate(0deg) translateY(0px); }
                    50% { transform: rotate(-8deg) translateY(-2px); }
                }
                @keyframes charTwinkle {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.75); opacity: 0.45; }
                }
                .anim-char-float {
                    animation: charFloat 3s ease-in-out infinite;
                }
                .anim-char-shadow {
                    transform-box: fill-box;
                    transform-origin: center;
                    animation: charShadow 3s ease-in-out infinite;
                }
                .anim-char-wave {
                    transform-box: fill-box;
                    transform-origin: 20% 90%;
                    animation: charWave 2.2s ease-in-out infinite;
                }
                .anim-char-search {
                    transform-box: fill-box;
                    transform-origin: 25% 85%;
                    animation: charSearch 2.4s ease-in-out infinite;
                }
                .anim-char-twinkle {
                    transform-box: fill-box;
                    transform-origin: center;
                    animation: charTwinkle 2s ease-in-out infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .anim-char-float,
                    .anim-char-shadow,
                    .anim-char-wave,
                    .anim-char-search,
                    .anim-char-twinkle {
                        animation: none;
                    }
                }
            `}</style>

            {/* Lingkaran latar solid (tanpa blur) */}
            <div
                className={`absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    isSearchEmpty ? "bg-amber-50" : "bg-indigo-50"
                }`}
            />

            <svg
                viewBox="0 0 180 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-full h-full"
            >
                {/* Bayangan lantai */}
                <ellipse
                    cx="90"
                    cy="126"
                    rx="54"
                    ry="7"
                    fill="#E2E8F0"
                    className="anim-char-shadow"
                />

                {/* Bintang / sparkle dekorasi */}
                <path
                    d="M34 32L36.5 38L42.5 40.5L36.5 43L34 49L31.5 43L25.5 40.5L31.5 38L34 32Z"
                    fill="#FBBF24"
                    className="anim-char-twinkle"
                />
                <circle
                    cx="146"
                    cy="34"
                    r="4"
                    fill="#818CF8"
                    className="anim-char-twinkle"
                    style={{ animationDelay: "0.4s" }}
                />
                <circle
                    cx="154"
                    cy="54"
                    r="2.5"
                    fill="#34D399"
                    className="anim-char-twinkle"
                    style={{ animationDelay: "0.9s" }}
                />

                {/* Grup karakter utama yang mengambang halus */}
                <g className="anim-char-float">
                    {/* Badan karakter */}
                    <path
                        d="M58 122C58 98 71 86 90 86C109 86 122 98 122 122H58Z"
                        fill={isSearchEmpty ? "#4F46E5" : "#123C42"}
                    />
                    {/* Kerah / aksen */}
                    <path
                        d="M78 88L90 100L102 88"
                        stroke={isSearchEmpty ? "#C7D2FE" : "#E3C86B"}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Tangan kiri */}
                    <path
                        d="M61 102C49 104 42 96 44 86"
                        stroke={isSearchEmpty ? "#4F46E5" : "#123C42"}
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    <circle cx="44" cy="84" r="5" fill="#FDBA74" />

                    {/* Tangan kanan (melambai atau memegang kaca pembesar) */}
                    {isSearchEmpty ? (
                        <g className="anim-char-search">
                            <path
                                d="M119 102C130 98 135 89 131 80"
                                stroke="#4F46E5"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <circle cx="131" cy="78" r="5" fill="#FDBA74" />
                            {/* Kaca pembesar */}
                            <circle
                                cx="142"
                                cy="71"
                                r="10"
                                fill="#EEF2FF"
                                stroke="#4F46E5"
                                strokeWidth="3"
                            />
                            <path
                                d="M149 78L157 86"
                                stroke="#4F46E5"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                        </g>
                    ) : (
                        <g className="anim-char-wave">
                            <path
                                d="M119 102C132 97 138 86 135 74"
                                stroke="#123C42"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <circle cx="135" cy="72" r="5" fill="#FDBA74" />
                        </g>
                    )}

                    {/* Kepala */}
                    <rect
                        x="62"
                        y="38"
                        width="56"
                        height="52"
                        rx="25"
                        fill="#FFEDD5"
                        stroke="#FED7AA"
                        strokeWidth="2"
                    />

                    {/* Rambut */}
                    <path
                        d="M62 56C62 40 74 32 90 32C106 32 118 40 118 56C110 50 99 48 90 51C80 48 70 50 62 56Z"
                        fill="#1E293B"
                    />

                    {/* Pipi merona */}
                    <ellipse
                        cx="73"
                        cy="68"
                        rx="4.5"
                        ry="2.5"
                        fill="#FDA4AF"
                        opacity="0.7"
                    />
                    <ellipse
                        cx="107"
                        cy="68"
                        rx="4.5"
                        ry="2.5"
                        fill="#FDA4AF"
                        opacity="0.7"
                    />

                    {/* Mata & ekspresi */}
                    {isSearchEmpty ? (
                        <>
                            <circle cx="79" cy="61" r="3.5" fill="#0F172A" />
                            <circle
                                cx="80.2"
                                cy="59.8"
                                r="1.2"
                                fill="#FFFFFF"
                            />
                            <circle cx="101" cy="61" r="3.5" fill="#0F172A" />
                            <circle
                                cx="102.2"
                                cy="59.8"
                                r="1.2"
                                fill="#FFFFFF"
                            />
                            <path
                                d="M74 54C76 52 81 52 83 54"
                                stroke="#334155"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M97 53C100 50 105 51 107 54"
                                stroke="#334155"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M85 73C88 71 92 71 95 73"
                                stroke="#334155"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </>
                    ) : (
                        <>
                            <circle cx="79" cy="61" r="3.5" fill="#0F172A" />
                            <circle
                                cx="80.2"
                                cy="59.8"
                                r="1.2"
                                fill="#FFFFFF"
                            />
                            <circle cx="101" cy="61" r="3.5" fill="#0F172A" />
                            <circle
                                cx="102.2"
                                cy="59.8"
                                r="1.2"
                                fill="#FFFFFF"
                            />
                            <path
                                d="M83 70C86 74.5 94 74.5 97 70"
                                stroke="#334155"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </>
                    )}
                </g>
            </svg>
        </div>
    );
}

function CourseEmptyState({ filtered, onCreate, onResetFilter }) {
    return (
        // Tanpa kotak (border/bg/shadow) supaya tampil sama di semua kondisi.
        <div className="px-6 py-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
                <EmptyCharacterIllustration
                    variant={filtered ? "search" : "empty"}
                />

                <div className="space-y-1.5">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            filtered
                                ? "bg-amber-50 text-amber-700"
                                : "bg-indigo-50 text-indigo-700"
                        }`}
                    >
                        {filtered ? "Tidak Ada Hasil" : "Belum Ada Kursus"}
                    </span>

                    <h3 className="text-lg font-bold text-slate-900">
                        {filtered
                            ? "Tidak ada kursus yang cocok"
                            : "Belum ada kursus"}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed">
                        {filtered
                            ? "Ubah kata kunci atau filter status untuk melihat kursus lain."
                            : "Buat kursus pertama, lalu tambahkan pelajaran dan unggah videonya."}
                    </p>
                </div>

                <div className="pt-1">
                    {filtered ? (
                        <button
                            type="button"
                            onClick={onResetFilter}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <RotateCcw size={14} />
                            <span>Reset pencarian & filter</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>Tambah kursus</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CourseRow({ course, onEdit, onDelete }) {
    const [imgBroken, setImgBroken] = useState(false);
    const thumbnailUrl = resolveThumbnailUrl(course);
    const hasThumbnail = Boolean(thumbnailUrl) && !imgBroken;
    const lessonsCount = getLessonsCount(course);
    const readyLessonsCount = getReadyLessonsCount(course);

    return (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_130px_150px_140px_170px] gap-3 md:gap-4 items-center px-5 sm:px-6 py-4 hover:bg-slate-50/70 transition">
            {/* Thumbnail + Judul & Deskripsi */}
            <div className="min-w-0 flex items-start gap-3.5">
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {hasThumbnail ? (
                        <img
                            src={thumbnailUrl}
                            alt={course.title}
                            onError={() => setImgBroken(true)}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <ImageIcon size={18} className="text-slate-400" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <Link
                        to={`/admin/courses/${course.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition line-clamp-1"
                    >
                        {course.title}
                    </Link>
                    {course.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Status Badge */}
            <div>
                <CourseStatusBadge
                    status={course.status}
                    label={course.status_label}
                />
            </div>

            {/* Jumlah Pelajaran */}
            <div className="text-sm text-slate-700">
                <span className="font-medium">{lessonsCount}</span> pelajaran
                <div className="text-xs text-slate-400">
                    {readyLessonsCount} video siap
                </div>
            </div>

            {/* Tanggal Diperbarui */}
            <div className="text-xs text-slate-500">
                {formatDate(course.updated_at)}
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center md:justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                    to={`/admin/courses/${course.id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-700 text-xs font-medium transition"
                >
                    Kelola
                </Link>
                <button
                    type="button"
                    aria-label={`Ubah ${course.title}`}
                    title="Ubah kursus"
                    onClick={() => onEdit(course)}
                    className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                >
                    <Pencil size={16} />
                </button>
                <button
                    type="button"
                    aria-label={`Hapus ${course.title}`}
                    title="Hapus kursus"
                    onClick={() => onDelete(course)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

export default function CourseList() {
    useDocumentTitle("Kursus");

    const toast = useToast();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null); // { type: 'create' | 'edit' | 'delete', course? }

    const q = useDebounced(search);
    const params = new URLSearchParams({ page });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);

    const { data, loading, error, reload } = useFetch(
        `/admin/courses?${params}`,
    );
    const courses = data?.data ?? [];
    const filtered = Boolean(q.trim() || status);

    function resetFilter() {
        setSearch("");
        setStatus("");
        setPage(1);
    }

    async function remove(course) {
        try {
            await api.delete(`/admin/courses/${course.id}`);
            toast.success("Kursus dihapus.");
            setModal(null);
            if (courses.length === 1 && page > 1) setPage(page - 1);
            else reload();
        } catch (err) {
            toast.error(err.message);
            setModal(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Kursus
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola kursus, susun pelajaran, dan unggah video materi.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setModal({ type: "create" })}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition cursor-pointer shrink-0"
                >
                    <Plus size={18} />
                    <span>Tambah kursus</span>
                </button>
            </header>

            {/* Toolbar Filter & Pencarian */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        aria-hidden="true"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                        type="search"
                        placeholder="Cari judul atau deskripsi..."
                        aria-label="Cari kursus"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                    />
                </div>

                <select
                    aria-label="Filter status"
                    value={status}
                    onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                    }}
                    className="sm:w-48 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition cursor-pointer"
                >
                    <option value="">Semua status</option>
                    <option value="published">Terbit</option>
                    <option value="draft">Draf</option>
                </select>
            </div>

            {error && <ErrorNotice error={error} onRetry={reload} />}
            {loading && !data && <Loading />}

            {/* State Kosong (animasi karakter) */}
            {data && courses.length === 0 && (
                <CourseEmptyState
                    filtered={filtered}
                    onCreate={() => setModal({ type: "create" })}
                    onResetFilter={resetFilter}
                />
            )}

            {/* Daftar / Tabel Kursus */}
            {courses.length > 0 && (
                <div
                    className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-opacity ${
                        loading ? "opacity-60" : "opacity-100"
                    }`}
                >
                    {/* Header Tabel (Desktop) */}
                    <div
                        className="hidden md:grid md:grid-cols-[minmax(0,2fr)_130px_150px_140px_170px] gap-4 px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500"
                        aria-hidden="true"
                    >
                        <span>Kursus</span>
                        <span>Status</span>
                        <span>Pelajaran</span>
                        <span>Diperbarui</span>
                        <span className="text-right">Aksi</span>
                    </div>

                    {/* Baris Data */}
                    <div className="divide-y divide-slate-100">
                        {courses.map((course) => (
                            <CourseRow
                                key={course.id}
                                course={course}
                                onEdit={(c) =>
                                    setModal({ type: "edit", course: c })
                                }
                                onDelete={(c) =>
                                    setModal({ type: "delete", course: c })
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            <Pagination meta={data?.meta} onPage={setPage} />

            {modal?.type === "create" && (
                <CourseFormModal
                    onClose={() => setModal(null)}
                    onSaved={(course) => {
                        toast.success(
                            "Kursus dibuat. Tambahkan pelajaran pertama.",
                        );
                        navigate(`/admin/courses/${course.id}`);
                    }}
                />
            )}
            {modal?.type === "edit" && (
                <CourseFormModal
                    course={modal.course}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        toast.success("Perubahan disimpan.");
                        setModal(null);
                        reload();
                    }}
                />
            )}
            {modal?.type === "delete" && (
                <ConfirmDialog
                    title="Hapus kursus?"
                    message={`Kursus “${modal.course.title}” beserta ${getLessonsCount(modal.course)} pelajaran dan seluruh videonya akan dihapus permanen.`}
                    confirmLabel="Hapus kursus"
                    onCancel={() => setModal(null)}
                    onConfirm={() => remove(modal.course)}
                />
            )}
        </div>
    );
}
