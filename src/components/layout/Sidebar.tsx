"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { NAV_ITEMS, ROLE_HIERARCHY } from "@/lib/constants";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    CalendarClock,
    Users,
    Landmark,
    BarChart3,
    Settings,
    Receipt,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Package,
    CalendarClock,
    Users,
    Landmark,
    BarChart3,
    Settings,
};

export default function Sidebar() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const { isMobileMenuOpen, setMobileMenuOpen, isMobile } = useLayout();
    const [collapsed, setCollapsed] = useState(false);

    const isRtl = locale === "ar";
    const userRole = profile?.role ?? "cashier";

    // Filter nav items by role
    const visibleItems = NAV_ITEMS.filter(
        (item) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[item.minRole]
    );

    const isActive = (href: string) => {
        const fullHref = `/${locale}${href}`;
        return pathname === fullHref || pathname.startsWith(fullHref + "/");
    };

    const handleNavigation = () => {
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside
                className="fixed top-0 bottom-0 z-50 flex flex-col transition-all duration-300 glass"
                style={{
                    width: isMobile ? "var(--sidebar-width)" : collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
                    insetInlineStart: isMobile ? (isMobileMenuOpen ? "0" : "-100%") : "0",
                }}
            >
                {/* Logo Area */}
                <div
                    className="flex items-center gap-3 px-4 shrink-0"
                    style={{
                        height: "var(--header-height)",
                        borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
                    }}
                >
                    <div
                        className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                        style={{
                            background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
                        }}
                    >
                        <span className="text-base font-bold text-white">M</span>
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold text-white whitespace-nowrap">
                            {locale === "ar" ? "ملبوس" : "Malboos"}
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {visibleItems.map((item) => {
                        const IconComp = ICON_MAP[item.icon];
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                onClick={handleNavigation}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                                style={{
                                    background: active
                                        ? "linear-gradient(135deg, rgba(216, 128, 48, 0.15), rgba(216, 128, 48, 0.05))"
                                        : "transparent",
                                    color: active
                                        ? "var(--color-brand-400)"
                                        : "var(--color-surface-400)",
                                    borderInlineStart: active
                                        ? "3px solid var(--color-brand-500)"
                                        : "3px solid transparent",
                                }}
                                title={collapsed && !isMobile ? t(item.key) : undefined}
                            >
                                {IconComp && <IconComp size={20} />}
                                {(!collapsed || isMobile) && <span>{t(item.key)}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Button */}
                <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(148, 163, 184, 0.08)" }}>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="btn btn-ghost w-full justify-center"
                        aria-label="Toggle sidebar"
                    >
                        {isRtl ? (
                            collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
                        ) : (
                            collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
                        )}
                    </button>

                    {/* Sign Out */}
                    <button
                        onClick={signOut}
                        className="btn btn-ghost w-full justify-center mt-1"
                        style={{ color: "var(--color-danger)" }}
                        title={collapsed ? t("dashboard") : undefined}
                    >
                        <LogOut size={18} />
                        {!collapsed && (
                            <span className="text-sm">{locale === "ar" ? "خروج" : "Logout"}</span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
