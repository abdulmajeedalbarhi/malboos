"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useDashboardStats, useTransactions, useRentals } from "@/hooks/useSupabase";
import {
    TrendingUp, CalendarClock, AlertTriangle, DollarSign,
    ShoppingCart, ArrowRight, Loader2, Package,
} from "lucide-react";

export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const locale = useLocale();
    const { profile } = useAuth();
    const { activeBranchId } = useLayout();

    const isMultiTenant = profile?.role === "admin" || profile?.role === "owner";
    const branchId = isMultiTenant ? (activeBranchId || undefined) : (profile?.branch_id ?? undefined);

    const { data: stats, isLoading: statsLoading } = useDashboardStats(branchId);
    const { data: recentTx } = useTransactions(branchId, 5);
    const { data: activeRentals } = useRentals(branchId, "active");

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));

    if (statsLoading) {
        return <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>;
    }

    const statCards = [
        { label: t("totalSales"), value: formatCurrency(stats?.totalSales || 0), icon: TrendingUp, color: "#34d399", bg: "rgba(16,185,129,0.12)", link: "/transactions" },
        { label: t("activeRentals"), value: (stats?.activeRentals || 0).toString(), icon: CalendarClock, color: "#60a5fa", bg: "rgba(59,130,246,0.12)", link: "/rentals" },
        { label: t("overdueRentals"), value: (stats?.overdueRentals || 0).toString(), icon: AlertTriangle, color: "#f87171", bg: "rgba(239,68,68,0.12)", link: "/rentals" },
        { label: t("totalRevenue"), value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: "#fbbf24", bg: "rgba(251,191,36,0.12)", link: "/reports" },
    ];

    return (
        <div className="space-y-6 animate-fade-in content-container">
            {/* Stat Cards — Clickable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                {statCards.map((stat, i) => (
                    <Link key={i} href={stat.link} className="card group transition-all hover:scale-[1.02]" style={{ padding: "1.25rem", textDecoration: "none" }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: stat.bg, color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-surface-400)" }} />
                        </div>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-surface-400)" }}>{stat.label}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions — Clickable */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--color-surface-700)" }}>
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <ShoppingCart size={18} style={{ color: "var(--color-brand-400)" }} />
                            {t("recentTransactions")}
                        </h2>
                        <Link href="/transactions" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-brand-400)", textDecoration: "none" }}>
                            {locale === "ar" ? "عرض الكل" : "View All"} <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y" style={{ "--tw-divide-opacity": "0.08" } as any}>
                        {(!recentTx || recentTx.length === 0) ? (
                            <div className="text-center py-8">
                                <ShoppingCart size={36} className="mx-auto mb-2 opacity-20" style={{ color: "var(--color-surface-400)" }} />
                                <p className="text-sm" style={{ color: "var(--color-surface-500)" }}>{locale === "ar" ? "لا توجد معاملات بعد" : "No transactions yet"}</p>
                                <Link href="/pos" className="btn btn-primary btn-sm mt-3 inline-flex" style={{ textDecoration: "none" }}>
                                    {locale === "ar" ? "إنشاء معاملة" : "Create Transaction"}
                                </Link>
                            </div>
                        ) : recentTx.map((tx: any) => (
                            <Link key={tx.id} href="/transactions" className="flex items-center justify-between p-3.5 transition-all hover:bg-white/[0.02]" style={{ textDecoration: "none" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                                        background: tx.type === "sale" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)",
                                    }}>
                                        {tx.type === "sale" ? <ShoppingCart size={14} style={{ color: "#34d399" }} /> : <CalendarClock size={14} style={{ color: "#60a5fa" }} />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-white">{tx.notes || (tx.type === "sale" ? (locale === "ar" ? "عملية بيع" : "Sale") : (locale === "ar" ? "دفع إيجار" : "Rental"))}</p>
                                        <p className="text-xs" style={{ color: "var(--color-surface-500)" }}>{formatDate(tx.created_at)}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-white">{formatCurrency(tx.final_amount)}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Active Rentals — Clickable */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--color-surface-700)" }}>
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <CalendarClock size={18} style={{ color: "#60a5fa" }} />
                            {t("activeRentals")}
                        </h2>
                        <Link href="/rentals" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-brand-400)", textDecoration: "none" }}>
                            {locale === "ar" ? "عرض الكل" : "View All"} <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y" style={{ "--tw-divide-opacity": "0.08" } as any}>
                        {(!activeRentals || activeRentals.length === 0) ? (
                            <div className="text-center py-8">
                                <CalendarClock size={36} className="mx-auto mb-2 opacity-20" style={{ color: "var(--color-surface-400)" }} />
                                <p className="text-sm" style={{ color: "var(--color-surface-500)" }}>{locale === "ar" ? "لا توجد إيجارات نشطة" : "No active rentals"}</p>
                            </div>
                        ) : activeRentals.slice(0, 5).map((rental: any) => {
                            const notes = rental.notes ? (() => { try { return typeof rental.notes === "string" ? JSON.parse(rental.notes) : rental.notes; } catch { return {}; } })() : {};
                            return (
                                <Link key={rental.id} href="/rentals" className="flex items-center justify-between p-3.5 transition-all hover:bg-white/[0.02]" style={{ textDecoration: "none" }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                                            <CalendarClock size={14} style={{ color: "#60a5fa" }} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white">{notes.customer_name || rental.customers?.full_name || "—"}</p>
                                            <p className="text-xs" style={{ color: "var(--color-surface-500)" }}>
                                                {locale === "ar" ? "يستحق" : "Due"}: {new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", { month: "short", day: "numeric" }).format(new Date(rental.due_date))}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: "#60a5fa" }}>{formatCurrency(rental.rental_fee)}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Inventory by Category */}
            {stats?.inventorySummary && stats.inventorySummary.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                    <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--color-surface-700)" }}>
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <Package size={18} style={{ color: "#a78bfa" }} />
                            {locale === "ar" ? "ملخص المخزون" : "Inventory Summary"}
                        </h2>
                        <Link href="/inventory" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-brand-400)", textDecoration: "none" }}>
                            {locale === "ar" ? "عرض الكل" : "View All"} <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {stats.inventorySummary.map((cat: any, i: number) => (
                            <Link key={i} href="/inventory" className="p-3 rounded-xl text-center transition-all hover:scale-105" style={{ background: "var(--color-surface-800)", textDecoration: "none" }}>
                                <p className="text-2xl font-bold" style={{ color: "var(--color-brand-400)" }}>{cat.count}</p>
                                <p className="text-xs mt-1" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? cat.name_ar : cat.name}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
