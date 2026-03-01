"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useDashboardStats, useBranches } from "@/hooks/useSupabase";
import { Bell, Globe, Menu, X, AlertTriangle, Settings, LogOut } from "lucide-react";

export default function Header() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const { profile, signOut } = useAuth();
    const { isMobileMenuOpen, toggleMobileMenu, activeBranchId, setActiveBranchId } = useLayout();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const otherLocale = locale === "ar" ? "en" : "ar";
    const roleName = profile?.role ? t(`roles.${profile.role}`) : "";
    const isMultiTenant = profile?.role === "admin" || profile?.role === "owner";
    const branchId = isMultiTenant ? (activeBranchId || undefined) : (profile?.branch_id ?? undefined);

    const { data: stats } = useDashboardStats(branchId);
    const { data: branches } = useBranches();

    const overdueCount = stats?.overdueRentals || 0;
    const hasNotifications = overdueCount > 0;

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header
            className="fixed top-0 z-30 flex items-center justify-between px-4 lg:px-6 glass end-0 lg:start-[var(--sidebar-width)] start-0 transition-all duration-300"
            style={{
                height: "var(--header-height)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
            }}
        >
            {/* Left side - Page context */}
            <div className="flex items-center gap-3">
                {profile && (
                    <div className="hidden sm:block">
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
            <div className="flex items-center gap-1 sm:gap-2 relative">

                {/* Branch Context Selector (Admin & Owner ONLY) */}
                {isMultiTenant && branches && branches.length > 0 && (
                    <select
                        value={activeBranchId || "all"}
                        onChange={(e) => setActiveBranchId(e.target.value === "all" ? null : e.target.value)}
                        className="me-1 hidden sm:block px-2 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-surface-800)] text-white border border-[var(--color-surface-700)] focus:outline-none focus:border-[var(--color-brand-400)] transition-colors cursor-pointer"
                        style={{ maxWidth: "160px" }}
                    >
                        <option value="all">{locale === "ar" ? "جميع الفروع" : "All Branches"}</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>
                                {locale === "ar" ? b.name_ar : b.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative btn btn-ghost p-2 rounded-xl transition-all hover:bg-white/5"
                        aria-label="Notifications"
                    >
                        <Bell size={20} />
                        {hasNotifications && (
                            <span
                                className="absolute top-1.5 inline-end-1.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                                style={{
                                    background: "var(--color-danger)",
                                    borderColor: "var(--color-surface-900)"
                                }}
                            />
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-[320px] rounded-2xl p-2 shadow-xl z-50 animate-fade-in right-0" style={{
                            background: "var(--color-surface-800)",
                            border: "1px solid var(--color-surface-700)",
                        }}>
                            <div className="flex items-center justify-between p-2 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <h3 className="text-sm font-semibold text-white">{locale === "ar" ? "الإشعارات" : "Notifications"}</h3>
                                {hasNotifications && <span className="text-xs font-bold" style={{ color: "var(--color-danger)" }}>{overdueCount} {locale === "ar" ? "جديد" : "New"}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                                {!hasNotifications ? (
                                    <div className="p-4 text-center">
                                        <Bell size={24} className="mx-auto mb-2 opacity-20 text-white" />
                                        <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>
                                            {locale === "ar" ? "لا توجد إشعارات حالياً" : "No new notifications"}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {overdueCount > 0 && (
                                            <button
                                                onClick={() => { setShowNotifications(false); router.push("/rentals"); }}
                                                className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-white/5 text-start w-full"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
                                                    <AlertTriangle size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white line-clamp-2">
                                                        {locale === "ar" ? `يوجد عدد ${overdueCount} إيجارات متأخرة!` : `There are ${overdueCount} overdue rentals!`}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: "#f87171" }}>
                                                        {locale === "ar" ? "اضغط للمراجعة" : "Click to review"}
                                                    </p>
                                                </div>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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

                {/* User Avatar Dropdown */}
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ms-2 transition-transform hover:scale-105 active:scale-95"
                        style={{
                            background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
                            color: "white",
                        }}
                    >
                        {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </button>

                    {showProfileDropdown && (
                        <div className="absolute top-full mt-2 w-48 rounded-2xl p-2 shadow-xl z-50 animate-fade-in right-0" style={{
                            background: "var(--color-surface-800)",
                            border: "1px solid var(--color-surface-700)",
                        }}>
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setShowProfileDropdown(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/5 text-start w-full text-white"
                                    style={{ textDecoration: "none" }}
                                >
                                    <Settings size={16} style={{ color: "var(--color-brand-400)" }} />
                                    <span className="text-sm font-medium">{locale === "ar" ? "الإعدادات" : "Settings"}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setShowProfileDropdown(false);
                                        signOut();
                                    }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-danger/10 text-start w-full"
                                    style={{ color: "var(--color-danger)" }}
                                >
                                    <LogOut size={16} />
                                    <span className="text-sm font-medium">{locale === "ar" ? "خروج" : "Logout"}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
