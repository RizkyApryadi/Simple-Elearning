import { useEffect, useState } from "react";
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { initials } from "../lib/format";

export function Spinner({ size = 18 }) {
    return <Loader2 className="spinner" size={size} aria-hidden="true" />;
}

export function Loading({ label = "Memuat…" }) {
    return (
        <div className="loading" role="status">
            <Spinner /> {label}
        </div>
    );
}

export function ErrorNotice({ error, onRetry }) {
    return (
        <div className="notice notice--error" role="alert">
            <AlertTriangle size={18} />
            <div>
                <p>{error?.message ?? "Terjadi kesalahan."}</p>
                {onRetry && (
                    <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ marginTop: 8 }}
                        onClick={onRetry}
                    >
                        Coba lagi
                    </button>
                )}
            </div>
        </div>
    );
}

export function CourseStatusBadge({ status, label }) {
    return (
        <span className={`badge ${status === "published" ? "badge--ok" : ""}`}>
            {label ?? status}
        </span>
    );
}

const VIDEO_BADGE = {
    ready: "badge--ok",
    uploading: "badge--warn badge--uploading",
    failed: "badge--danger",
    none: "",
};

export function VideoStatusBadge({ video }) {
    return (
        <span className={`badge ${VIDEO_BADGE[video.status] ?? ""}`}>
            {video.status_label}
        </span>
    );
}

export function EmptyState({ icon: Icon, title, children, action }) {
    return (
        <div className="empty">
            {Icon && <Icon size={32} aria-hidden="true" />}
            <h3>{title}</h3>
            {children && <p>{children}</p>}
            {action}
        </div>
    );
}

export function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;

    return (
        <nav className="pagination" aria-label="Halaman">
            <span>
                Halaman {meta.current_page} dari {meta.last_page} ({meta.total}{" "}
                kursus)
            </span>
            <div className="pagination__nav">
                <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={meta.current_page <= 1}
                    onClick={() => onPage(meta.current_page - 1)}
                >
                    <ChevronLeft size={16} /> Sebelumnya
                </button>
                <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onPage(meta.current_page + 1)}
                >
                    Berikutnya <ChevronRight size={16} />
                </button>
            </div>
        </nav>
    );
}

export function Field({ id, label, error, hint, children }) {
    return (
        <div className="field">
            <label className="field__label" htmlFor={id}>
                {label}
            </label>
            {children}
            {hint && !error && (
                <span className="field__hint" id={`${id}-hint`}>
                    {hint}
                </span>
            )}
            {error && (
                <span className="field__error" id={`${id}-error`} role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}

export function Brand({ light = false, className = "" }) {
    const title = window.__APP_CONFIG__?.name ?? "Ruang Belajar";

    return (
        <span
            className={`inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0 ${className}`}
        >
            <span
                aria-hidden="true"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                    light
                        ? "bg-white/10 text-amber-300 ring-1 ring-white/15"
                        : "bg-[#123c42] text-[#e3c86b] shadow-2xs"
                }`}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                >
                    <path d="M4 6.5h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17.5h10" />
                </svg>
            </span>

            <span
                className={`text-base font-bold tracking-tight leading-none ${
                    light ? "text-white" : "text-slate-900"
                }`}
            >
                {title}
            </span>
        </span>
    );
}

function resolveCourseThumbnail(course) {
    if (!course) return null;
    if (course.thumbnail_url) return course.thumbnail_url;
    if (course.thumbnail) {
        return course.thumbnail.startsWith("http")
            ? course.thumbnail
            : `/storage/${course.thumbnail}`;
    }
    return null;
}

/** Sampul buku tulis atau foto thumbnail kursus; fallback ke inisial & warna id kursus. */
export function CourseCover({ course, large = false }) {
    const thumbnailUrl = resolveCourseThumbnail(course);
    const [imgBroken, setImgBroken] = useState(false);

    useEffect(() => {
        setImgBroken(false);
    }, [thumbnailUrl]);

    const hasThumbnail = Boolean(thumbnailUrl) && !imgBroken;

    if (hasThumbnail) {
        return (
            <div
                className={`cover ${large ? "cover--lg" : ""}`}
                style={{ padding: 0, overflow: "hidden" }}
                aria-hidden="true"
            >
                <img
                    src={thumbnailUrl}
                    alt={course.title || "Thumbnail kursus"}
                    onError={() => setImgBroken(true)}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={`cover cover--${Number(course.id) % 5} ${large ? "cover--lg" : ""}`}
            aria-hidden="true"
        >
            <span className="cover__letters">{initials(course.title)}</span>
        </div>
    );
}
