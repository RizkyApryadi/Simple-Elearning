import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Spinner } from "./ui";

/**
 * Modal berbasis <dialog> native: focus trap, tombol Esc, dan ::backdrop sudah ditangani browser.
 * `busy` mencegah penutupan saat proses simpan/unggah berjalan.
 */
export function Modal({
    title,
    onClose,
    busy = false,
    wide = false,
    onSubmit,
    footer,
    children,
}) {
    const ref = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => {
            if (dialog?.open) dialog.close();
        };
    }, []);

    const handleCancel = (event) => {
        event.preventDefault();
        if (!busy) onClose();
    };

    const handleBackdropClick = (event) => {
        if (event.target === ref.current && !busy) onClose();
    };

    const Wrapper = onSubmit ? "form" : "div";
    const wrapperProps = onSubmit ? { onSubmit, noValidate: true } : {};

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onCancel={handleCancel}
            onClick={handleBackdropClick}
            className={`m-auto w-[calc(100%-2rem)] ${
                wide ? "max-w-2xl" : "max-w-md"
            } rounded-2xl border border-slate-200/80 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs open:flex open:flex-col max-h-[90vh] overflow-hidden`}
        >
            <Wrapper
                className="flex flex-col max-h-[90vh] overflow-hidden"
                {...wrapperProps}
            >
                {/* Header Modal */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
                    <h2
                        id={titleId}
                        className="text-lg font-bold tracking-tight text-slate-900"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Tutup"
                        className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Modal (bisa di-scroll jika form panjang) */}
                <div className="px-6 py-5 overflow-y-auto space-y-4 text-sm text-slate-600">
                    {children}
                </div>

                {/* Footer Modal */}
                {footer && (
                    <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50/80 border-t border-slate-100 shrink-0">
                        {footer}
                    </div>
                )}
            </Wrapper>
        </dialog>
    );
}

export function ConfirmDialog({
    title,
    message,
    confirmLabel = "Hapus",
    onConfirm,
    onCancel,
}) {
    const [busy, setBusy] = useState(false);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            title={title}
            onClose={onCancel}
            busy={busy}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition disabled:opacity-50 cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer"
                    >
                        {busy && <Spinner size={16} />}
                        <span>{confirmLabel}</span>
                    </button>
                </>
            }
        >
            <p className="leading-relaxed text-slate-600">{message}</p>
        </Modal>
    );
}
