"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, useTransactions, useRentals } from "@/hooks/useSupabase";
import {
    BarChart3, TrendingUp, Package, CalendarClock, DollarSign,
    ShoppingCart, AlertTriangle, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

export default function ReportsPage() {
    const locale = useLocale();
    const { profile } = useAuth();
    const branchId = profile?.branch_id ?? undefined;

    const { data: stats, isLoading: statsLoading } = useDashboardStats(branchId);
    const { data: transactions } = useTransactions(branchId);
    const { data: allRentals } = useRentals(branchId, "all");

    const [expandedSection, setExpandedSection] = useState<string | null>("sales");

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }).format(amount);

    // Compute stats
    const totalTransactions = transactions?.length || 0;
    const totalSalesAmount = transactions?.filter((t: any) => t.type === "sale").reduce((sum: number, t: any) => sum + (t.final_amount || 0), 0) || 0;
    const totalRentalPayments = transactions?.filter((t: any) => t.type === "rental_payment").reduce((sum: number, t: any) => sum + (t.final_amount || 0), 0) || 0;
    const totalRefunds = transactions?.filter((t: any) => t.type === "refund").reduce((sum: number, t: any) => sum + (t.final_amount || 0), 0) || 0;

    const cashTransactions = transactions?.filter((t: any) => t.payment_method === "cash").length || 0;
    const cardTransactions = transactions?.filter((t: any) => t.payment_method === "card").length || 0;
    const transferTransactions = transactions?.filter((t: any) => t.payment_method === "transfer").length || 0;

    const totalRentals = allRentals?.length || 0;
    const activeRentals = allRentals?.filter((r: any) => r.status === "active").length || 0;
    const overdueRentals = allRentals?.filter((r: any) => r.status === "overdue").length || 0;
    const returnedRentals = allRentals?.filter((r: any) => r.status === "returned" || r.status === "completed").length || 0;
    const totalRentalRevenue = allRentals?.reduce((sum: number, r: any) => sum + (r.rental_fee || 0), 0) || 0;
    const totalDeposits = allRentals?.reduce((sum: number, r: any) => sum + (r.deposit_paid || 0), 0) || 0;
    const totalOverdueFees = allRentals?.reduce((sum: number, r: any) => sum + (r.overdue_fee || 0), 0) || 0;

    const toggle = (section: string) => setExpandedSection(expandedSection === section ? null : section);

    if (statsLoading) {
        return <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                    <BarChart3 size={22} style={{ color: "var(--color-brand-400)" }} />
                </div>
                <h1 className="text-2xl font-bold text-white">{locale === "ar" ? "التقارير" : "Reports"}</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: "#34d399", bg: "rgba(16,185,129,0.12)" },
                    { label: locale === "ar" ? "مبيعات اليوم" : "Today's Sales", value: formatCurrency(stats?.totalSales || 0), icon: TrendingUp, color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
                    { label: locale === "ar" ? "المعاملات" : "Transactions", value: totalTransactions.toString(), icon: ShoppingCart, color: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
                    { label: locale === "ar" ? "الإيجارات النشطة" : "Active Rentals", value: (stats?.activeRentals || 0).toString(), icon: CalendarClock, color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: "1.25rem" }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: stat.bg, color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-surface-400)" }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Sales Report */}
            <div className="card" style={{ padding: 0 }}>
                <button onClick={() => toggle("sales")} className="w-full flex items-center justify-between p-4" style={{ borderBottom: expandedSection === "sales" ? "1px solid var(--color-surface-700)" : "none" }}>
                    <div className="flex items-center gap-3">
                        <ShoppingCart size={20} style={{ color: "#34d399" }} />
                        <h2 className="text-base font-semibold text-white">{locale === "ar" ? "تقرير المبيعات" : "Sales Report"}</h2>
                    </div>
                    {expandedSection === "sales" ? <ChevronUp size={18} style={{ color: "var(--color-surface-400)" }} /> : <ChevronDown size={18} style={{ color: "var(--color-surface-400)" }} />}
                </button>
                {expandedSection === "sales" && (
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                <p className="text-lg font-bold text-white">{formatCurrency(totalSalesAmount)}</p>
                                <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "إجمالي المبيعات" : "Total Sales"}</p>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                <p className="text-lg font-bold" style={{ color: "#60a5fa" }}>{formatCurrency(totalRentalPayments)}</p>
                                <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "دفعات الإيجار" : "Rental Payments"}</p>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                <p className="text-lg font-bold" style={{ color: "#f87171" }}>{formatCurrency(totalRefunds)}</p>
                                <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "المبالغ المستردة" : "Refunds"}</p>
                            </div>
                        </div>

                        {/* Payment Method Breakdown */}
                        <div>
                            <h3 className="text-sm font-medium text-white mb-3">{locale === "ar" ? "حسب طريقة الدفع" : "By Payment Method"}</h3>
                            <div className="space-y-2">
                                {[
                                    { label: locale === "ar" ? "نقداً" : "Cash", count: cashTransactions, color: "#34d399" },
                                    { label: locale === "ar" ? "بطاقة" : "Card", count: cardTransactions, color: "#60a5fa" },
                                    { label: locale === "ar" ? "تحويل" : "Transfer", count: transferTransactions, color: "#a78bfa" },
                                ].map(pm => (
                                    <div key={pm.label} className="flex items-center gap-3">
                                        <span className="text-sm w-16" style={{ color: "var(--color-surface-400)" }}>{pm.label}</span>
                                        <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "var(--color-surface-800)" }}>
                                            <div className="h-full rounded-lg transition-all flex items-center justify-end px-2" style={{
                                                width: `${totalTransactions > 0 ? (pm.count / totalTransactions * 100) : 0}%`,
                                                background: pm.color, minWidth: pm.count > 0 ? "2rem" : 0,
                                            }}>
                                                <span className="text-xs font-bold text-white">{pm.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rental Report */}
            <div className="card" style={{ padding: 0 }}>
                <button onClick={() => toggle("rentals")} className="w-full flex items-center justify-between p-4" style={{ borderBottom: expandedSection === "rentals" ? "1px solid var(--color-surface-700)" : "none" }}>
                    <div className="flex items-center gap-3">
                        <CalendarClock size={20} style={{ color: "#60a5fa" }} />
                        <h2 className="text-base font-semibold text-white">{locale === "ar" ? "تقرير الإيجارات" : "Rental Report"}</h2>
                    </div>
                    {expandedSection === "rentals" ? <ChevronUp size={18} style={{ color: "var(--color-surface-400)" }} /> : <ChevronDown size={18} style={{ color: "var(--color-surface-400)" }} />}
                </button>
                {expandedSection === "rentals" && (
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: locale === "ar" ? "إجمالي الإيجارات" : "Total Rentals", value: totalRentals, color: "#60a5fa" },
                                { label: locale === "ar" ? "نشط" : "Active", value: activeRentals, color: "#34d399" },
                                { label: locale === "ar" ? "متأخر" : "Overdue", value: overdueRentals, color: "#f87171" },
                                { label: locale === "ar" ? "مكتمل" : "Completed", value: returnedRentals, color: "#94a3b8" },
                            ].map(s => (
                                <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                    <p className="text-xs mt-1" style={{ color: "var(--color-surface-400)" }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                <p className="text-lg font-bold text-white">{formatCurrency(totalRentalRevenue)}</p>
                                <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "إيرادات الإيجار" : "Rental Revenue"}</p>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                <p className="text-lg font-bold" style={{ color: "#fbbf24" }}>{formatCurrency(totalDeposits)}</p>
                                <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "التأمينات" : "Deposits"}</p>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface-800)" }}>
                                <p className="text-lg font-bold" style={{ color: "#f87171" }}>{formatCurrency(totalOverdueFees)}</p>
                                <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "رسوم التأخير" : "Overdue Fees"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Inventory Report */}
            <div className="card" style={{ padding: 0 }}>
                <button onClick={() => toggle("inventory")} className="w-full flex items-center justify-between p-4" style={{ borderBottom: expandedSection === "inventory" ? "1px solid var(--color-surface-700)" : "none" }}>
                    <div className="flex items-center gap-3">
                        <Package size={20} style={{ color: "#a78bfa" }} />
                        <h2 className="text-base font-semibold text-white">{locale === "ar" ? "تقرير المخزون" : "Inventory Report"}</h2>
                    </div>
                    {expandedSection === "inventory" ? <ChevronUp size={18} style={{ color: "var(--color-surface-400)" }} /> : <ChevronDown size={18} style={{ color: "var(--color-surface-400)" }} />}
                </button>
                {expandedSection === "inventory" && (
                    <div className="p-4">
                        {stats?.inventorySummary && stats.inventorySummary.length > 0 ? (
                            <div className="space-y-3">
                                {stats.inventorySummary.map((cat: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-surface-800)" }}>
                                        <span className="text-sm font-medium text-white">{locale === "ar" ? cat.name_ar : cat.name}</span>
                                        <span className="text-lg font-bold" style={{ color: "var(--color-brand-400)" }}>{cat.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-center py-4" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "لا توجد بيانات مخزون" : "No inventory data"}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
