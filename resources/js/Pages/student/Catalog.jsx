import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BookOpen,
    GraduationCap,
    PlayCircle,
    RotateCcw,
    Search,
} from "lucide-react";
import { useDebounced, useDocumentTitle, useFetch } from "../../lib/hooks";
import { ErrorNotice, Loading, Pagination } from "../../components/ui";

const COVER_GRADIENTS = [
    "from-indigo-600 via-blue-600 to-sky-500",
    "from-violet-600 via-purple-600 to-indigo-600",
    "from-emerald-600 via-teal-600 to-cyan-600",
    "from-amber-500 via-orange-600 to-rose-600",
    "from-slate-800 via-indigo-900 to-slate-900",
];

function getInitials(title = "") {
    return title
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");
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
                    {/* Badan karakter (hoodie/kaos) */}
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

                    {/* Rambut / topi kecil */}
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

function CatalogEmptyState({ query, onResetSearch }) {
    const isSearchEmpty = Boolean(query.trim());

    return (
        // Tanpa kotak (border/bg/shadow) supaya tampilan sama
        // di semua kondisi, apa pun warna background halamannya.
        <div className="px-6 py-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
                <EmptyCharacterIllustration
                    variant={isSearchEmpty ? "search" : "empty"}
                />

                <div className="space-y-1.5">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            isSearchEmpty
                                ? "bg-amber-50 text-amber-700"
                                : "bg-indigo-50 text-indigo-700"
                        }`}
                    >
                        {isSearchEmpty
                            ? "Pencarian Kosong"
                            : "Belum Ada Materi"}
                    </span>

                    <h3 className="text-lg font-bold text-slate-900">
                        {isSearchEmpty
                            ? "Kursus tidak ditemukan"
                            : "Belum ada kursus tersedia"}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed">
                        {isSearchEmpty
                            ? `Tidak ada kursus yang cocok dengan kata kunci “${query.trim()}”. Coba periksa ejaan atau pakai kata kunci lain.`
                            : "Kelas belum dibuka saat ini. Kursus akan muncul di sini setelah diterbitkan oleh admin."}
                    </p>
                </div>

                {isSearchEmpty && onResetSearch && (
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={onResetSearch}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <RotateCcw size={14} />
                            <span>Reset pencarian</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function CourseCard({ course }) {
    const [imgBroken, setImgBroken] = useState(false);
    const gradient =
        COVER_GRADIENTS[Number(course.id) % COVER_GRADIENTS.length];
    const initials = getInitials(course.title) || "EL";
    const thumbnailUrl = resolveThumbnailUrl(course);
    const hasThumbnail = Boolean(thumbnailUrl) && !imgBroken;

    return (
        <li className="flex">
            <Link
                to={`/courses/${course.id}`}
                className="group flex flex-col w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-200"
            >
                {/* Cover Kursus */}
                <div
                    className={`relative h-44 w-full overflow-hidden ${
                        hasThumbnail
                            ? "bg-slate-900"
                            : `bg-gradient-to-br ${gradient} p-5 flex flex-col justify-between`
                    }`}
                >
                    {hasThumbnail ? (
                        <>
                            <img
                                src={thumbnailUrl}
                                alt={course.title}
                                onError={() => setImgBroken(true)}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20"
                                aria-hidden="true"
                            />
                            <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 backdrop-blur-xs text-white text-xs font-medium">
                                <PlayCircle
                                    size={13}
                                    className="text-indigo-200"
                                />
                              
                            </span>
                        </>
                    ) : (
                        <>
                            <div
                                className="pointer-events-none absolute -right-6 -bottom-6 text-white/10 transition-transform duration-300 group-hover:scale-110"
                                aria-hidden="true"
                            >
                                <GraduationCap size={120} />
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 text-white font-bold text-sm tracking-wider">
                                    {initials}
                                </span>

                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/35 backdrop-blur-xs text-white text-xs font-medium">
                                    <PlayCircle
                                        size={13}
                                        className="text-indigo-200"
                                    />
                                    <span>
                                        {course.lessons_count ?? 0} pelajaran
                                    </span>
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Konten Kartu */}
                <div className="flex flex-1 flex-col justify-between p-5">
                    <div className="space-y-2">
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                            {course.title}
                        </h2>

                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description ||
                                "Pelajari materi video secara bertahap dari dasar hingga praktik."}
                        </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                        <span>Lihat silabus & belajar</span>
                        <ArrowRight
                            size={15}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                    </div>
                </div>
            </Link>
        </li>
    );
}

export default function Catalog() {
    useDocumentTitle("Katalog Kursus");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const q = useDebounced(search);

    const params = new URLSearchParams({ page });
    if (q.trim()) params.set("q", q.trim());

    const { data, loading, error, reload } = useFetch(`/courses?${params}`);
    const courses = data?.data ?? [];
    const totalCourses = data?.meta?.total ?? courses.length;

    const handleResetSearch = () => {
        setSearch("");
        setPage(1);
    };

    return (
        <div className="space-y-7">
            {/* Hero Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 px-6 py-8 sm:px-10 sm:py-10 text-white shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide text-indigo-100">
                        <BookOpen size={13} />
                        <span>Ruang Belajar</span>
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Pilih kursus untuk dipelajari
                    </h1>
                </div>

                {/* Dekorasi Latar Halus */}
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -bottom-20 right-24 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl"
                    aria-hidden="true"
                />
            </section>

            {/* Toolbar Pencarian & Info Jumlah */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                    <Search
                        size={17}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="search"
                        placeholder="Cari judul atau topik kursus..."
                        aria-label="Cari kursus"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs transition focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                </div>

                {data && (
                    <p className="text-xs sm:text-sm text-slate-500">
                        Menampilkan{" "}
                        <span className="font-semibold text-slate-800">
                            {courses.length}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-slate-800">
                            {totalCourses}
                        </span>{" "}
                        kursus tersedia
                    </p>
                )}
            </div>

            {/* State Error & Loading Awal */}
            {error && <ErrorNotice error={error} onRetry={reload} />}
            {loading && !data && <Loading />}

            {/* State Kosong */}
            {data && courses.length === 0 && (
                <CatalogEmptyState
                    query={q}
                    onResetSearch={handleResetSearch}
                />
            )}

            {/* Grid Kartu Kursus */}
            {courses.length > 0 && (
                <ul
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${
                        loading ? "opacity-60" : "opacity-100"
                    }`}
                >
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </ul>
            )}

            {/* Pagination */}
            <Pagination meta={data?.meta} onPage={setPage} />
        </div>
    );
}
