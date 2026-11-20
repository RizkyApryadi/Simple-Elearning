import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../lib/hooks";
import { homeFor } from "../lib/format";
import { Brand, Field, Loading, Spinner } from "../components/ui";

export default function Login() {
    useDocumentTitle("Masuk");

    const { user, loading, login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    if (loading) {
        return (
            <div className="fullpage">
                <Loading />
            </div>
        );
    }

    if (user) return <Navigate to={homeFor(user)} replace />;

    const set = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    async function submit(event) {
        event.preventDefault();
        if (busy) return;

        setBusy(true);
        setErrors({});
        setMessage("");

        try {
            const me = await login(form.email.trim(), form.password);
            navigate(homeFor(me), { replace: true });
        } catch (error) {
            setErrors(error.errors ?? {});
            setMessage(error.status === 422 ? "" : error.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-between bg-slate-50/70 px-4 py-8 sm:px-6 text-slate-900">
            {/* Spacer atas agar kartu tepat di tengah */}
            <div aria-hidden="true" />

            <main className="mx-auto w-full max-w-[400px] space-y-6">
                {/* Logo / Brand */}
                <div className="flex justify-center">
                    <Brand />
                </div>

                {/* Card Login */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="space-y-1 text-center">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Masuk ke akun
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Masukkan email dan kata sandi untuk melanjutkan.
                        </p>
                    </div>

                    {message && (
                        <div
                            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs sm:text-sm text-red-700"
                            role="alert"
                        >
                            <AlertTriangle
                                size={16}
                                className="mt-0.5 shrink-0 text-red-600"
                            />
                            <span>{message}</span>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={submit} noValidate>
                        <Field
                            id="email"
                            label="Email"
                            error={errors.email?.[0]}
                        >
                            <input
                                id="email"
                                type="email"
                                autoComplete="username"
                                placeholder="nama@email.com"
                                value={form.email}
                                onChange={set("email")}
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={
                                    errors.email ? "email-error" : undefined
                                }
                                autoFocus
                                required
                                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
                                    errors.email
                                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                                        : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/15"
                                }`}
                            />
                        </Field>

                        <Field
                            id="password"
                            label="Kata sandi"
                            error={errors.password?.[0]}
                        >
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={set("password")}
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={
                                        errors.password
                                            ? "password-error"
                                            : undefined
                                    }
                                    required
                                    className={`w-full rounded-xl border bg-white pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
                                        errors.password
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                                            : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/15"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Sembunyikan kata sandi"
                                            : "Lihat kata sandi"
                                    }
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                >
                                    {showPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}
                                </button>
                            </div>
                        </Field>

                        <button
                            type="submit"
                            disabled={busy}
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                            {busy && <Spinner size={16} />}
                            <span>{busy ? "Memproses…" : "Masuk"}</span>
                        </button>
                    </form>
                </div>
            </main>

            <footer className="text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} E-Learning System
            </footer>
        </div>
    );
}
