import { useRef, useState } from 'react';
import { AlertTriangle, Film, Info, Trash2, UploadCloud, X } from 'lucide-react';
import { api, uploadVideo } from '../../lib/api';
import { formatBytes } from '../../lib/format';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { Field, Spinner, VideoStatusBadge } from '../../components/ui';

const config = window.__APP_CONFIG__ ?? {};
const MAX_MB = config.maxVideoMb ?? 200;
const MIMES = config.videoMimes ?? ['video/mp4'];
const EXTENSIONS = config.videoExtensions ?? ['mp4'];

function validateFile(file) {
    if (file.size > MAX_MB * 1024 * 1024) return `Ukuran video melebihi batas ${MAX_MB} MB.`;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!MIMES.includes(file.type) && !EXTENSIONS.includes(extension)) {
        return 'Format video tidak didukung. Gunakan MP4, WebM, MOV, atau OGV.';
    }
    return null;
}

/**
 * Tambah / ubah pelajaran sekaligus unggah video.
 * Alur: simpan data pelajaran dulu (JSON) -> unggah video (XHR + progress) -> segarkan daftar.
 * Bila unggahan gagal, pelajaran tetap tersimpan dan unggahan bisa diulang tanpa mengisi ulang form.
 */
export default function LessonModal({ course, lesson, onClose, onChanged }) {
    const toast = useToast();
    const [current, setCurrent] = useState(lesson ?? null);
    const [form, setForm] = useState({
        title: lesson?.title ?? '',
        description: lesson?.description ?? '',
    });
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null); // { type: 'error' | 'info', text }
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [phase, setPhase] = useState('idle'); // idle | saving | uploading | removing
    const [progress, setProgress] = useState(0);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const abortRef = useRef(null);

    const busy = phase !== 'idle';
    const video = current?.video;
    const hasVideo = Boolean(video && video.status !== 'none');

    const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

    function pickFile(picked) {
        if (!picked) return;
        const problem = validateFile(picked);
        setFileError(problem ?? '');
        setFile(problem ? null : picked);
    }

    async function submit(event) {
        event.preventDefault();
        setErrors({});
        setNotice(null);
        setPhase('saving');

        let saved;
        try {
            saved = current
                ? await api.put(`/admin/lessons/${current.id}`, form)
                : await api.post(`/admin/courses/${course.id}/lessons`, form);
            setCurrent(saved);
        } catch (error) {
            setErrors(error.errors ?? {});
            setNotice({
                type: 'error',
                text: error.status === 422 ? 'Periksa kembali isian yang ditandai.' : error.message,
            });
            setPhase('idle');
            return;
        }

        if (!file) {
            toast.success(current ? 'Perubahan disimpan.' : 'Pelajaran ditambahkan.');
            onChanged();
            onClose();
            return;
        }

        setPhase('uploading');
        setProgress(0);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await uploadVideo(saved.id, file, { onProgress: setProgress, signal: controller.signal });
            toast.success('Pelajaran dan video tersimpan.');
            onChanged();
            onClose();
        } catch (error) {
            // Ambil status terbaru dari server (bisa "failed" atau tetap video lama).
            try {
                setCurrent(await api.get(`/admin/lessons/${saved.id}`));
            } catch {
                /* abaikan; notice di bawah tetap tampil */
            }
            onChanged();
            setNotice({
                type: error.aborted ? 'info' : 'error',
                text: error.aborted
                    ? 'Unggahan dibatalkan. Data pelajaran sudah tersimpan; pilih video lagi untuk mengunggah.'
                    : `${error.message} Data pelajaran sudah tersimpan, Anda bisa mencoba mengunggah lagi.`,
            });
            setPhase('idle');
        } finally {
            abortRef.current = null;
        }
    }

    async function removeVideo() {
        setPhase('removing');
        setConfirmRemove(false);
        try {
            setCurrent(await api.delete(`/admin/lessons/${current.id}/video`));
            toast.success('Video dihapus.');
            onChanged();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setPhase('idle');
        }
    }

    const isNew = !current;
    const submitLabel = file
        ? isNew
            ? 'Tambah dan unggah video'
            : 'Simpan dan unggah video'
        : isNew
          ? 'Tambah pelajaran'
          : 'Simpan perubahan';

    const inputBase =
        'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500';
    const inputNormal = 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20';
    const inputError = 'border-red-300 focus:border-red-500 focus:ring-red-500/20';

    return (
        <Modal
            title={lesson ? 'Ubah pelajaran' : 'Tambah pelajaran'}
            onClose={onClose}
            busy={busy}
            wide
            onSubmit={submit}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition disabled:opacity-50 cursor-pointer"
                    >
                        {current && !lesson ? 'Tutup' : 'Batal'}
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer"
                    >
                        {(phase === 'saving' || phase === 'uploading') && <Spinner size={16} />}
                        <span>{phase === 'uploading' ? 'Mengunggah…' : submitLabel}</span>
                    </button>
                </>
            }
        >
            {notice && (
                <div
                    role="alert"
                    className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium ${
                        notice.type === 'info'
                            ? 'bg-sky-50 border-sky-200 text-sky-800'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                >
                    {notice.type === 'info' ? (
                        <Info size={16} className="shrink-0 mt-0.5 text-sky-600" />
                    ) : (
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    )}
                    <span>{notice.text}</span>
                </div>
            )}

            <Field id="lesson-title" label="Judul pelajaran" error={errors.title?.[0]}>
                <input
                    id="lesson-title"
                    type="text"
                    placeholder="Contoh: 01. Instalasi dan Struktur Direktori"
                    value={form.title}
                    onChange={set('title')}
                    maxLength={200}
                    disabled={busy}
                    aria-invalid={Boolean(errors.title)}
                    autoFocus
                    className={`${inputBase} ${errors.title ? inputError : inputNormal}`}
                />
            </Field>

            <Field id="lesson-description" label="Deskripsi" error={errors.description?.[0]}>
                <textarea
                    id="lesson-description"
                    rows={3}
                    placeholder="Catatan singkat atau ringkasan materi pelajaran ini..."
                    value={form.description}
                    onChange={set('description')}
                    disabled={busy}
                    aria-invalid={Boolean(errors.description)}
                    className={`${inputBase} resize-y ${errors.description ? inputError : inputNormal}`}
                />
            </Field>

            {/* Bagian Upload / Manajemen Video */}
            <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Video</span>

                {/* Chip Video yang Sudah Terpasang */}
                {hasVideo && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                            <Film size={20} aria-hidden="true" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {video.original_name ?? 'Tanpa nama file'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {video.size ? formatBytes(video.size) : video.status_label}
                            </p>
                            {video.status === 'failed' && video.error && (
                                <p className="mt-1 text-xs font-medium text-red-600">{video.error}</p>
                            )}
                        </div>

                        <VideoStatusBadge video={video} />

                        {!confirmRemove ? (
                            <button
                                type="button"
                                aria-label="Hapus video"
                                title="Hapus video"
                                disabled={busy}
                                onClick={() => setConfirmRemove(true)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={removeVideo}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer"
                                >
                                    Hapus video
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmRemove(false)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                                >
                                    Batal
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Progress Bar Saat Mengunggah */}
                {phase === 'uploading' ? (
                    <div
                        role="status"
                        className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-2.5"
                    >
                        <div className="flex items-center justify-between gap-3 text-xs font-medium text-indigo-950">
                            <span className="truncate">Mengunggah {file?.name}</span>
                            <strong className="font-bold text-indigo-700 shrink-0">{progress}%</strong>
                        </div>
                        <div
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            className="w-full h-2 rounded-full bg-indigo-200/70 overflow-hidden"
                        >
                            <div
                                className="h-full bg-indigo-600 transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => abortRef.current?.abort()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                        >
                            Batalkan unggahan
                        </button>
                    </div>
                ) : file ? (
                    /* Chip File Baru yang Siap Diunggah */
                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-white shrink-0">
                            <UploadCloud size={20} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-indigo-600 font-medium">
                                {formatBytes(file.size)} siap diunggah
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Batalkan pilihan file"
                            title="Batalkan pilihan file"
                            disabled={busy}
                            onClick={() => setFile(null)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition disabled:opacity-50 cursor-pointer shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    /* Dropzone Upload */
                    <label
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragOver(false);
                            pickFile(event.dataTransfer.files?.[0]);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 px-4 py-7 rounded-xl border-2 border-dashed text-center transition cursor-pointer ${
                            dragOver
                                ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700'
                                : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                        <div className="p-2.5 rounded-full bg-white border border-slate-200 shadow-2xs text-indigo-600 mb-1">
                            <UploadCloud size={22} aria-hidden="true" />
                        </div>
                        <strong className="text-sm font-semibold text-slate-800">
                            {hasVideo ? 'Pilih video pengganti' : 'Pilih video atau tarik ke sini'}
                        </strong>
                        <span className="text-xs text-slate-500">
                            Format MP4, WebM, MOV, atau OGV, maksimal {MAX_MB} MB.
                        </span>
                        <input
                            type="file"
                            accept={MIMES.join(',')}
                            disabled={busy}
                            className="sr-only"
                            onChange={(event) => {
                                pickFile(event.target.files?.[0]);
                                event.target.value = '';
                            }}
                        />
                    </label>
                )}

                {(fileError || errors.video?.[0]) && (
                    <p className="text-xs font-medium text-red-600" role="alert">
                        {fileError || errors.video[0]}
                    </p>
                )}
            </div>
        </Modal>
    );
}