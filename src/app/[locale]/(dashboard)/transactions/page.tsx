"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useSupabase";
import { createClient } from "@/lib/supabase/client";
import {
    Receipt, Search, ShoppingCart, CalendarClock, Banknote, CreditCard,
    ArrowRightLeft, Loader2, Eye, Pencil, X, Check, Filter,
} from "lucide-react";

const supabase = createClient();

export default function TransactionsPage() {
    const t = useTranslations();
    const tc = useTranslations("common");
    const locale = useLocale();
    const { profile } = useAuth();

    const branchId = profile?.role === "admin" || profile?.role === "owner" ? undefined : profile?.branch_id ?? undefined;
    const { data: transactions, isLoading, refetch } = useTransactions(branchId);

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "sale" | "rental_payment" | "rental_deposit" | "refund">("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNotes, setEditNotes] = useState("");
    const [editDiscount, setEditDiscount] = useState(0);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        }).format(new Date(date));

    const typeLabels: Record<string, { ar: string; en: string; color: string; bg: string }> = {
        sale: { ar: "بيع", en: "Sale", color: "#34d399", bg: "rgba(16, 185, 129, 0.15)" },
        rental_payment: { ar: "دفع إيجار", en: "Rental Pay", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)" },
        rental_deposit: { ar: "تأمين إيجار", en: "Deposit", color: "#a78bfa", bg: "rgba(139, 92, 246, 0.15)" },
        refund: { ar: "استرجاع", en: "Refund", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)" },
    };

    const paymentIcons: Record<string, React.ComponentType<{ size?: number }>> = {
        cash: Banknote, card: CreditCard, transfer: ArrowRightLeft,
    };

    const filtered = transactions?.filter((tx: Record<string, unknown>) => {
        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        const matchesSearch = !searchQuery ||
            (tx.notes as string)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.customers as any)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    }) || [];

    const handleEdit = (tx: Record<string, unknown>) => {
        setEditingId(tx.id as string);
        setEditNotes((tx.notes as string) || "");
        setEditDiscount((tx.discount as number) || 0);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            const { error } = await supabase
                .from("transactions")
                .update({ notes: editNotes, discount: editDiscount })
                .eq("id", editingId);
            if (error) throw error;
            setEditingId(null);
            refetch();
        } catch (err) {
            console.error("Edit failed:", err);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                        <Receipt size={22} style={{ color: "var(--color-brand-400)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{locale === "ar" ? "سجل المعاملات" : "Transaction History"}</h1>
                        <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>
                            {filtered.length} {locale === "ar" ? "معاملة" : "transactions"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute top-1/2 -translate-y-1/2" style={{ color: "var(--color-surface-400)", insetInlineStart: "0.75rem" }} />
                    <input type="text" className="input" placeholder={tc("search") + "..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingInlineStart: "2.25rem" }} />
                </div>
            </div>

            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--color-surface-900)" }}>
                {(["all", "sale", "rental_payment", "refund"] as const).map((s) => (
                    <button key={s} onClick={() => setTypeFilter(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{
                        background: typeFilter === s ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "transparent",
                        color: typeFilter === s ? "white" : "var(--color-surface-400)",
                    }}>
                        {s === "all" ? (locale === "ar" ? "الكل" : "All") : (locale === "ar" ? typeLabels[s]?.ar : typeLabels[s]?.en)}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
            ) : filtered.length === 0 ? (
                <div className="card text-center py-12">
                    <Receipt size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{tc("noData")}</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {filtered.map((tx: Record<string, unknown>) => {
                        const type = tx.type as string;
                        const typeInfo = typeLabels[type] || typeLabels.sale;
                        const PayIcon = paymentIcons[tx.payment_method as string] || Banknote;
                        const isLocked = tx.is_locked as boolean;
                        const isEditing = editingId === (tx.id as string);

                        const customer = tx.customers as any;
                        let customerNameInfo = customer?.full_name || "";
                        let customerPhoneInfo = customer?.phone || "";

                        // Fallback parsing just in case
                        if (!customerNameInfo && tx.notes) {
                            try {
                                const n = JSON.parse(tx.notes as string);
                                if (n.customer_phone) customerPhoneInfo = n.customer_phone;
                                if (n.customer_name) customerNameInfo = n.customer_name;
                            } catch {
                                const parts = (tx.notes as string).split("-");
                                if (parts.length >= 2 && /[0-9]{8}/.test(parts[1])) {
                                    customerPhoneInfo = parts[1].trim();
                                    if (!customerNameInfo) customerNameInfo = parts[0].trim();
                                }
                            }
                        }

                        return (
                            <div key={tx.id as string} className="card" style={{ padding: "1rem" }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: typeInfo.bg }}>
                                            {type === "sale" ? <ShoppingCart size={18} style={{ color: typeInfo.color }} /> : <CalendarClock size={18} style={{ color: typeInfo.color }} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                                                    {locale === "ar" ? typeInfo.ar : typeInfo.en}
                                                </span>
                                                <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-surface-400)" }}>
                                                    <PayIcon size={12} />{tx.payment_method as string}
                                                </span>
                                                {isLocked && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
                                                        🔒 {locale === "ar" ? "مقفلة" : "Locked"}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: "var(--color-surface-400)" }}>
                                                {formatDate(tx.created_at as string)}
                                            </p>
                                            {(tx.notes as string) && !isEditing && (
                                                <p className="text-xs mt-1" style={{ color: "var(--color-surface-300)" }}>
                                                    📝 {tx.notes as string}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-end me-2">
                                            <p className="text-lg font-bold text-white">{formatCurrency(tx.final_amount as number)}</p>
                                            {(tx.discount as number) > 0 && (
                                                <p className="text-xs" style={{ color: "#f87171" }}>
                                                    -{formatCurrency(tx.discount as number)} {locale === "ar" ? "خصم" : "disc."}
                                                </p>
                                            )}
                                        </div>
                                        {customerPhoneInfo && (
                                            <a
                                                href={`https://wa.me/${customerPhoneInfo.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${customerNameInfo || 'عميلنا العزيز'}، شكرًا لتسوقك من البارحي!\n\nنوع العملية: ${typeInfo.ar}\nالمبلغ الإجمالي: ${tx.final_amount} ر.ع.\n\nنسعد بخدمتكم دائماً.`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg transition-all hover:scale-105"
                                                style={{ background: "rgba(37, 211, 102, 0.15)", color: "#25D366" }}
                                                title={locale === "ar" ? "إرسال الفاتورة عبر واتساب" : "Send Invoice via WhatsApp"}
                                            >
                                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                            </a>
                                        )}
                                        {!isLocked && !isEditing && (
                                            <button onClick={() => handleEdit(tx)} className="p-2 rounded-lg transition-all" style={{ background: "var(--color-surface-800)" }}>
                                                <Pencil size={14} style={{ color: "var(--color-surface-400)" }} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline Edit */}
                                {isEditing && (
                                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--color-surface-700)" }}>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-2">
                                                <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "ملاحظات" : "Notes"}</label>
                                                <input className="input" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "خصم" : "Discount"}</label>
                                                <input className="input" type="number" step="0.001" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editDiscount} onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveEdit} className="btn btn-sm flex items-center gap-1" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}>
                                                <Check size={14} />{tc("save")}
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm flex items-center gap-1">
                                                <X size={14} />{tc("cancel")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
