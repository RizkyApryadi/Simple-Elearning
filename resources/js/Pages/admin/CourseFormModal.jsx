import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, X } from "lucide-react";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { Field, Spinner } from "../../components/ui";

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

export default function CourseFormModal({ course, onClose, onSaved }) {
    const isEdit = Boolean(course);

    const [form, setForm] = useState({
        title: course?.title ?? "",
        description: course?.description ?? "",
        status: course?.status ?? "draft",
    });

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    const fileInputRef = useRef(null);

    const existingThumbnail = resolveThumbnailUrl(course);
    const currentPreview = thumbnailPreview || existingThumbnail;

    const set = (field) => (event) =>
        setForm((prev) => ({ ...prev, [field]: event.target.value }));

    // Membersihkan URL preview ketika modal ditutup atau gambar diganti.
    useEffect(() => {
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    function handleFileChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }

    function clearSelectedFile() {
        setThumbnailFile(null);
        setThumbnailPreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function submit(event) {
        event.preventDefault();

        setBusy(true);
        setErrors({});
        setNotice("");

        try {
            let saved;

            if (thumbnailFile) {
                const payload = new FormData();

                if (isEdit) {
                    payload.append("_method", "PUT");
                }

                payload.append("title", form.title);
                payload.append("description", form.description);
                payload.append("status", form.status);
                payload.append("thumbnail", thumbnailFile);

                saved = isEdit
                    ? await api.post(`/admin/courses/${course.id}`, payload)
                    : await api.post("/admin/courses", payload);
            } else {
                saved = isEdit
                    ? await api.put(`/admin/courses/${course.id}`, form)
                    : await api.post("/admin/courses", form);
            }

            onSaved(saved);
        } catch (error) {
            setErrors(error.errors ?? {});
            setNotice(
                error.status === 422
                    ? "Periksa kembali data yang diisi."
                    : error.message,
            );
            setBusy(false);
        }
    }

    const inputBase =
        "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2";

    const inputNormal =
        "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20";

    const inputError =
        "border-red-300 focus:border-red-500 focus:ring-red-500/20";

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />

            <Modal
                title={isEdit ? "Edit kursus" : "Tambah kursus"}
                onClose={onClose}
                busy={busy}
                onSubmit={submit}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition disabled:opacity-50 cursor-pointer"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={busy}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer"
                        >
                            {busy && <Spinner size={16} />}

                            <span>
                                {isEdit ? "Simpan perubahan" : "Buat kursus"}
                            </span>
                        </button>
                    </>
                }
            >
                {notice && (
                    <div
                        className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs"
                        role="alert"
                    >
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <span>{notice}</span>
                    </div>
                )}

                {/* Thumbnail */}
                <Field
                    id="course-thumbnail"
                    label="Thumbnail"
                    error={errors.thumbnail?.[0]}
                    hint="JPG, PNG, WebP · Maks. 2 MB"
                >
                    <div className="relative aspect-video w-full max-h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative w-full h-full flex items-center justify-center cursor-pointer"
                            aria-label="Pilih thumbnail kursus"
                        >
                            {currentPreview ? (
                                <>
                                    <img
                                        src={currentPreview}
                                        alt={form.title || "Thumbnail kursus"}
                                        className="w-full h-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 text-slate-700 text-xs font-medium">
                                            <ImagePlus size={15} />
                                            Ganti thumbnail
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    <ImagePlus size={28} />
                                    <span className="text-sm font-medium">
                                        Pilih thumbnail
                                    </span>
                                    <span className="text-xs">
                                        Klik untuk upload gambar
                                    </span>
                                </div>
                            )}
                        </button>

                        {thumbnailFile && (
                            <button
                                type="button"
                                onClick={clearSelectedFile}
                                title="Batalkan pilihan gambar"
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/75 text-white hover:bg-slate-900 transition cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </Field>

                {/* Judul */}
                <Field
                    id="course-title"
                    label="Judul kursus"
                    error={errors.title?.[0]}
                >
                    <input
                        id="course-title"
                        type="text"
                        placeholder="Contoh: Dasar Laravel"
                        value={form.title}
                        onChange={set("title")}
                        maxLength={200}
                        aria-invalid={Boolean(errors.title)}
                        autoFocus
                        className={`${inputBase} ${errors.title ? inputError : inputNormal}`}
                    />
                </Field>

                {/* Deskripsi */}
                <Field
                    id="course-description"
                    label="Deskripsi"
                    error={errors.description?.[0]}
                >
                    <textarea
                        id="course-description"
                        rows={3}
                        placeholder="Apa yang akan dipelajari dalam kursus ini?"
                        value={form.description}
                        onChange={set("description")}
                        aria-invalid={Boolean(errors.description)}
                        className={`${inputBase} resize-y ${errors.description ? inputError : inputNormal}`}
                    />
                </Field>

                {/* Status */}
                <Field
                    id="course-status"
                    label="Status publikasi"
                    error={errors.status?.[0]}
                >
                    <select
                        id="course-status"
                        value={form.status}
                        onChange={set("status")}
                        aria-invalid={Boolean(errors.status)}
                        className={`${inputBase} cursor-pointer ${errors.status ? inputError : inputNormal}`}
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </Field>
            </Modal>
        </>
    );
}
