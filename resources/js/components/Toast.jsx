import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(1);

    const push = useCallback((type, message) => {
        const id = nextId.current++;
        setToasts((list) => [...list, { id, type, message }]);
        setTimeout(
            () => setToasts((list) => list.filter((toast) => toast.id !== id)),
            type === "error" ? 6000 : 3500,
        );
    }, []);

    const api = useMemo(
        () => ({
            success: (message) => push("success", message),
            error: (message) => push("error", message),
        }),
        [push],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                className="toasts pointer-events-none fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
                aria-live="polite"
            >
                {toasts.map((toast) => {
                    const isError = toast.type === "error";
                    return (
                        <div
                            key={toast.id}
                            className={`toast pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-xs transition ${
                                isError
                                    ? "toast--error border-red-200 bg-white text-red-800"
                                    : "border-emerald-200 bg-white text-emerald-900"
                            }`}
                            role="status"
                        >
                            {isError ? (
                                <AlertTriangle
                                    size={18}
                                    className="shrink-0 text-red-600"
                                />
                            ) : (
                                <CheckCircle2
                                    size={18}
                                    className="shrink-0 text-emerald-600"
                                />
                            )}
                            <span className="leading-snug">
                                {toast.message}
                            </span>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
