import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pulihkan sesi saat halaman dimuat.
    useEffect(() => {
        let alive = true;
        api.get('/me')
            .then((me) => alive && setUser(me))
            .catch(() => {})
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    // Sesi habis di tengah pemakaian -> kembali ke login.
    useEffect(() => onUnauthorized(() => setUser(null)), []);

    const login = useCallback(async (email, password) => {
        const me = await api.post('/login', { email, password });
        setUser(me);
        return me;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider');
    return context;
}
