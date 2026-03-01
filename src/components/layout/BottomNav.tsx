"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { NAV_ITEMS, ROLE_HIERARCHY } from "@/lib/constants";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    CalendarClock,
    Receipt,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Package,
    CalendarClock,
};

export default function BottomNav() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname();
    const { profile } = useAuth();

    const userRole = profile?.role ?? "cashier";

    // Filter nav items by role, and exclude Customers and Settings for mobile bottom nav
    const visibleItems = NAV_ITEMS.filter(
        (item) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[item.minRole] &&
            ["dashboard", "pos", "transactions", "inventory", "rentals"].includes(item.key)
    );

    const isActive = (href: string) => {
        const fullHref = `/${locale}${href}`;
        return pathname === fullHref || (href !== "/dashboard" && pathname.startsWith(fullHref + "/"));
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around px-2 pb-safe pt-2 glass"
            style={{
                height: "var(--bottom-nav-height, 65px)",
                borderTop: "1px solid rgba(148, 163, 184, 0.08)",
                paddingBottom: "env(safe-area-inset-bottom)"
            }}
        >
            {visibleItems.map((item) => {
                const IconComp = ICON_MAP[item.icon];
                if (!IconComp) return null;

                const active = isActive(item.href);

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200"
                        style={{
                            color: active
                                ? "var(--color-brand-400)"
                                : "var(--color-surface-400)",
                        }}
                    >
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full mb-1" style={{
                            background: active ? "rgba(216, 128, 48, 0.15)" : "transparent",
                        }}>
                            <IconComp size={20} />
                        </div>
                        <span className="text-[10px] font-medium leading-none whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                            {t(item.key)}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
