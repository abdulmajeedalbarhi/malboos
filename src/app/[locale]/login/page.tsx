"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/i18n/routing";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const otherLocale = locale === "ar" ? "en" : "ar";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(t("auth.loginError"));
            setIsLoading(false);
        } else {
            router.push(`/${locale}/dashboard`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: "linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e293b 70%, #0f172a 100%)",
        }}>
            {/* Background decorative elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-48 -right-48 w-96 h-96 rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, var(--color-brand-500), transparent)" }}
                />
                <div
                    className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-8"
                    style={{ background: "radial-gradient(circle, var(--color-accent-500), transparent)" }}
                />
            </div>

            <div className="w-full max-w-md animate-fade-in relative z-10">
                {/* Language Switcher */}
                <div className="flex justify-end mb-6">
                    <Link
                        href="/login"
                        locale={otherLocale}
                        className="btn btn-ghost btn-sm text-sm"
                    >
                        {otherLocale === "ar" ? "العربية" : "English"}
                    </Link>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-8">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{
                                background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
                                boxShadow: "0 8px 32px rgba(216, 128, 48, 0.3)",
                            }}
                        >
                            <span className="text-2xl font-bold text-white">M</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {t("auth.loginTitle")}
                        </h1>
                        <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>
                            {t("auth.loginSubtitle")}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            className="mb-4 p-3 rounded-xl text-sm animate-fade-in"
                            style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                color: "#f87171",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="label">
                                {t("auth.email")}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="admin@malboos.om"
                                required
                                autoComplete="email"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                {t("auth.password")}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input"
                                    style={{ paddingInlineEnd: "2.75rem" }}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors"
                                    style={{
                                        insetInlineEnd: "0.5rem",
                                        color: "var(--color-surface-400)",
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-lg w-full"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {t("common.loading")}
                                </>
                            ) : (
                                t("auth.login")
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            className="text-sm transition-colors"
                            style={{ color: "var(--color-brand-400)" }}
                        >
                            {t("auth.forgotPassword")}
                        </button>
                    </div>
                </div>

                {/* Bottom branding */}
                <p
                    className="text-center mt-6 text-xs"
                    style={{ color: "var(--color-surface-500)" }}
                >
                    © 2026 Malboos — ملبوس
                </p>
            </div>
        </div>
    );
}
