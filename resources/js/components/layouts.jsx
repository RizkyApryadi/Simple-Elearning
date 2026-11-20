import { useState } from "react";
import { BookOpen, GraduationCap, LogOut, Menu, X } from "lucide-react";
import {
    Navigate,
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../lib/format";
import { Brand, Loading } from "./ui";

/** Penjaga rute: wajib login dan sesuai role; selain itu diarahkan ke tempat yang semestinya. */
export function RequireRole({ role, layout: Layout }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loading />
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
        );
    }

    if (user.role !== role) {
        return <Navigate to={homeFor(user)} replace />;
    }

    return <Layout />;
}

function useLogout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return async () => {
        await logout();
        navigate("/login", { replace: true });
    };
}

export function AdminLayout() {
    const { user } = useAuth();
    const logout = useLogout();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-900">
            {/* Backdrop gelap saat sidebar terbuka di layar mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Admin */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-5 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <Brand
                                light
                                className="inline-flex items-center gap-2.5 text-base font-bold tracking-tight text-white whitespace-nowrap"
                            />
                            <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-400/20 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                                Panel Admin
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer shrink-0"
                            aria-label="Tutup menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="space-y-1" aria-label="Menu utama">
                        <NavLink
                            to="/admin/courses"
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                }`
                            }
                        >
                            <BookOpen size={18} className="shrink-0" />
                            <span>Kursus</span>
                        </NavLink>
                    </nav>
                </div>

                {/* Info User & Tombol Keluar di bagian bawah sidebar */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="px-2 py-1.5 rounded-xl bg-slate-800/50">
                        <strong className="block text-sm font-semibold text-white truncate">
                            {user.name}
                        </strong>
                        <span className="block text-xs text-slate-400 truncate">
                            {user.email}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                        <LogOut size={15} />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Konten Utama */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Mobile dengan  Burger */}
                <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shrink-0"
                        aria-label="Buka menu"
                    >
                        <Menu size={22} />
                    </button>
                    <Brand className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap" />
                    <div className="w-8 shrink-0" aria-hidden="true" />
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export function StudentLayout() {
    const { user } = useAuth();
    const logout = useLogout();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 shadow-2xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 min-w-0">
                        <NavLink
                            to="/courses"
                            aria-label="Beranda"
                            className="shrink-0 whitespace-nowrap focus:outline-none"
                        >
                            <Brand className="inline-flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 whitespace-nowrap" />
                        </NavLink>

                        <nav
                            className="hidden sm:flex items-center gap-1.5"
                            aria-label="Menu utama"
                        >
                            <NavLink
                                to="/courses"
                                end={false}
                                className={({ isActive }) =>
                                    `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/15"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`
                                }
                            >
                                <GraduationCap size={16} />
                                <span>Kursus</span>
                            </NavLink>
                        </nav>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/70">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white uppercase">
                                {user?.name?.[0] ?? "S"}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                                {user.name}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-700 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span>Keluar</span>
                        </button>
                    </div>

                    {/*  Burger Mobile Student */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:hidden transition cursor-pointer shrink-0"
                        aria-label="Buka/tutup menu"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Dropdown Mobile Student */}
                {menuOpen && (
                    <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2.5 shadow-sm">
                        <NavLink
                            to="/courses"
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-slate-700 hover:bg-slate-100"
                                }`
                            }
                        >
                            <GraduationCap size={17} />
                            <span>Kursus</span>
                        </NavLink>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                    {user.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={logout}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-semibold text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
                            >
                                <LogOut size={14} />
                                <span>Keluar</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <Outlet />
            </main>
        </div>
    );
}
