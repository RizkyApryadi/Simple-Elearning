import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/** GET sederhana dengan loading/error, reload manual, dan setData untuk pembaruan optimistik. */
export function useFetch(path) {
    const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!path) return undefined;

        const controller = new AbortController();
        setState((prev) => ({ ...prev, loading: true, error: null }));

        api.get(path, { signal: controller.signal })
            .then((data) => setState({ data, error: null, loading: false }))
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setState({ data: null, error, loading: false });
            });

        return () => controller.abort();
    }, [path, tick]);

    const reload = useCallback(() => setTick((value) => value + 1), []);
    const setData = useCallback(
        (updater) =>
            setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater })),
        [],
    );

    return { ...state, reload, setData };
}

export function useDebounced(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

export function useDocumentTitle(title) {
    useEffect(() => {
        const base = window.__APP_CONFIG__?.name ?? 'Ruang Kelas';
        document.title = title ? `${title} - ${base}` : base;
    }, [title]);
}
