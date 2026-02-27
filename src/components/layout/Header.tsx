"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Globe } from "lucide-react";

export default function Header() {
    const t = useTranslations();
    const locale = useLocale();
    const { profile } = useAuth();

    const otherLocale = locale === "ar" ? "en" : "ar";
    const roleName = profile?.role ? t(`roles.${profile.role}`) : "";

    return (
        <header
            className="fixed top-0 z-30 flex items-center justify-between px-6 glass"
            style={{
                height: "var(--header-height)",
                insetInlineStart: "var(--sidebar-width)",
                insetInlineEnd: 0,
                borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
            }}
        >
            {/* Left side - Page context */}
            <div className="flex items-center gap-3">
                {profile && (
                    <div>
                        <p className="text-sm font-medium text-white">
                            {t("auth.welcomeBack")}, {profile.full_name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>
                            {roleName}
                        </p>
                    </div>
                )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <button
                    className="relative btn btn-ghost p-2 rounded-xl"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    {/* Notification dot */}
                    <span
                        className="absolute top-1.5 inline-end-1.5 w-2 h-2 rounded-full"
                        style={{
                            background: "var(--color-danger)",
                            insetInlineEnd: "0.375rem",
                        }}
                    />
                </button>

                {/* Language Switcher */}
                <Link
                    href="/dashboard"
                    locale={otherLocale}
                    className="btn btn-ghost btn-sm gap-1.5"
                >
                    <Globe size={16} />
                    <span className="text-xs font-medium">
                        {otherLocale === "ar" ? "عربي" : "EN"}
                    </span>
                </Link>

                {/* User Avatar */}
                <div
                    className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold"
                    style={{
                        background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
                        color: "white",
                    }}
                >
                    {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
            </div>
        </header>
    );
}
