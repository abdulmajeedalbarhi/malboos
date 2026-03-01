"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useFinancialPeriods, useCreateFinancialPeriod, useUpdateFinancialPeriod } from "@/hooks/useSupabase";
import {
    Landmark, Calendar, CheckCircle, Clock, Lock, Unlock, Send, Loader2, Plus, X,
} from "lucide-react";

const STATUS_STYLES: Record<string, { badge: string; icon: React.ComponentType<{ size?: number }> }> = {
    open: { badge: "badge-success", icon: Unlock },
    pending_approval: { badge: "badge-warning", icon: Clock },
    approved: { badge: "badge-info", icon: CheckCircle },
    closed: { badge: "badge-neutral", icon: Lock },
    reopened: { badge: "badge-warning", icon: Unlock },
};

export default function FinancialPage() {
    const t = useTranslations("financial");
    const tc = useTranslations("common");
    const locale = useLocale();
    const { profile } = useAuth();
    const { activeBranchId } = useLayout();

    const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly">("daily");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const isMultiTenant = profile?.role === "admin" || profile?.role === "owner";
    const branchId = isMultiTenant ? (activeBranchId || undefined) : (profile?.branch_id ?? undefined);
    const { data: periods, isLoading } = useFinancialPeriods(branchId, periodType);
    const createPeriod = useCreateFinancialPeriod();
    const updatePeriod = useUpdateFinancialPeriod();

    const [newPeriod, setNewPeriod] = useState({ start_date: "", end_date: "", comments: "" });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", { month: "short", day: "numeric" }).format(new Date(date));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.branch_id) return;
        try {
            await createPeriod.mutateAsync({
                branch_id: profile.branch_id,
                period_type: periodType,
                start_date: newPeriod.start_date,
                end_date: newPeriod.end_date,
                status: "open",
                submitted_by: null,
                approved_by: null,
                total_sales: 0,
                total_rentals: 0,
                total_refunds: 0,
                comments: newPeriod.comments || null,
                submitted_at: null,
                approved_at: null,
            });
            setShowCreateModal(false);
            setNewPeriod({ start_date: "", end_date: "", comments: "" });
        } catch (err) {
            console.error("Failed to create period:", err);
        }
    };

    const handleSubmit = (id: string) => updatePeriod.mutate({ id, status: "pending_approval", submitted_by: profile?.id, submitted_at: new Date().toISOString() });
    const handleApprove = (id: string) => updatePeriod.mutate({ id, status: "approved", approved_by: profile?.id, approved_at: new Date().toISOString() });
    const handleReject = (id: string) => updatePeriod.mutate({ id, status: "open", submitted_by: null, submitted_at: null });
    const handleClose = (id: string) => updatePeriod.mutate({ id, status: "closed" });
    const handleReopen = (id: string) => updatePeriod.mutate({ id, status: "reopened" });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                        <Landmark size={22} style={{ color: "var(--color-brand-400)" }} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface-900)" }}>
                        <button onClick={() => setPeriodType("weekly")} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{
                            background: periodType === "weekly" ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "transparent",
                            color: periodType === "weekly" ? "white" : "var(--color-surface-400)",
                        }}>{t("weeklyClosure")}</button>
                        <button onClick={() => setPeriodType("monthly")} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{
                            background: periodType === "monthly" ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "transparent",
                            color: periodType === "monthly" ? "white" : "var(--color-surface-400)",
                        }}>{t("monthlyClosure")}</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> {tc("add")}
                    </button>
                </div>
            </div>

            {/* Period Cards */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
            ) : !periods || periods.length === 0 ? (
                <div className="card text-center py-12">
                    <Landmark size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{tc("noData")}</p>
                    <button className="btn btn-primary btn-sm mt-4" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> {tc("add")}
                    </button>
                </div>
            ) : (
                <div className="space-y-4 stagger-children">
                    {periods.map((period: Record<string, unknown>) => {
                        const status = period.status as string;
                        const config = STATUS_STYLES[status] || STATUS_STYLES.open;
                        const StatusIcon = config.icon;
                        const isLocked = status === "closed" || status === "pending_approval";
                        const netTotal = (period.total_sales as number) + (period.total_rentals as number) - (period.total_refunds as number);

                        return (
                            <div key={period.id as string} className="card">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: "var(--color-surface-800)" }}>
                                            <Calendar size={22} style={{ color: "var(--color-brand-400)" }} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-white">
                                                    {formatDate(period.start_date as string)} — {formatDate(period.end_date as string)}
                                                </h3>
                                                <span className={`badge ${config.badge} flex items-center gap-1`}>
                                                    <StatusIcon size={12} />
                                                    {t(`status${status === "pending_approval" ? "Pending" : status.charAt(0).toUpperCase() + status.slice(1)}`)}
                                                </span>
                                            </div>
                                            {isLocked && (
                                                <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-surface-500)" }}>
                                                    <Lock size={12} />{t("lockedMessage")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-white">{formatCurrency(period.total_sales as number)}</p>
                                            <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{t("totalSales")}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold" style={{ color: "#60a5fa" }}>{formatCurrency(period.total_rentals as number)}</p>
                                            <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{t("totalRentals")}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold" style={{ color: "#f87171" }}>-{formatCurrency(period.total_refunds as number)}</p>
                                            <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{t("totalRefunds")}</p>
                                        </div>
                                        <div className="text-center ps-4" style={{ borderInlineStart: "1px solid var(--color-surface-700)" }}>
                                            <p className="text-sm font-bold" style={{ color: "var(--color-brand-400)" }}>{formatCurrency(netTotal)}</p>
                                            <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{tc("total")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions based on status and role */}
                                <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-surface-700)" }}>
                                    {status === "open" && (
                                        <button onClick={() => handleSubmit(period.id as string)} className="btn btn-primary btn-sm" disabled={updatePeriod.isPending}>
                                            <Send size={14} />{t("submitForApproval")}
                                        </button>
                                    )}
                                    {status === "pending_approval" && (profile?.role === "admin" || profile?.role === "owner" || profile?.role === "branch_manager") && (
                                        <>
                                            <button onClick={() => handleApprove(period.id as string)} className="btn btn-sm" style={{ background: "linear-gradient(135deg, var(--color-success), #059669)", color: "white" }} disabled={updatePeriod.isPending}>
                                                <CheckCircle size={14} />{t("approve")}
                                            </button>
                                            <button onClick={() => handleReject(period.id as string)} className="btn btn-danger btn-sm" disabled={updatePeriod.isPending}>
                                                {t("reject")}
                                            </button>
                                        </>
                                    )}
                                    {status === "approved" && (profile?.role === "admin" || profile?.role === "owner") && (
                                        <button onClick={() => handleClose(period.id as string)} className="btn btn-secondary btn-sm" disabled={updatePeriod.isPending}>
                                            <Lock size={14} />{locale === "ar" ? "إغلاق" : "Close"}
                                        </button>
                                    )}
                                    {status === "closed" && (profile?.role === "admin" || profile?.role === "owner") && (
                                        <button onClick={() => handleReopen(period.id as string)} className="btn btn-secondary btn-sm" disabled={updatePeriod.isPending}>
                                            <Unlock size={14} />{t("reopen")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Period Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div className="glass rounded-2xl p-6 w-full max-w-md animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">
                                {periodType === "weekly" ? t("weeklyClosure") : t("monthlyClosure")}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="label">{locale === "ar" ? "تاريخ البداية" : "Start Date"}</label>
                                <input className="input" type="date" dir="ltr" value={newPeriod.start_date} onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })} required />
                            </div>
                            <div>
                                <label className="label">{locale === "ar" ? "تاريخ النهاية" : "End Date"}</label>
                                <input className="input" type="date" dir="ltr" value={newPeriod.end_date} onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })} required />
                            </div>
                            <div>
                                <label className="label">{t("comments")}</label>
                                <textarea className="input" rows={3} value={newPeriod.comments} onChange={(e) => setNewPeriod({ ...newPeriod, comments: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={createPeriod.isPending}>
                                    {createPeriod.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {tc("add")}
                                </button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">{tc("cancel")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
