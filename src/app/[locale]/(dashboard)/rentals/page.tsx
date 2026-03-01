"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useRentals, useUpdateRental } from "@/hooks/useSupabase";
import {
    CalendarClock, Clock, AlertTriangle, CheckCircle, XCircle, Phone, Loader2,
    Pencil, X, CreditCard,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { badge: string; icon: React.ComponentType<{ size?: number }>; color: string }> = {
    booked: { badge: "badge-info", icon: Clock, color: "#60a5fa" },
    active: { badge: "badge-success", icon: CheckCircle, color: "#34d399" },
    overdue: { badge: "badge-danger", icon: AlertTriangle, color: "#f87171" },
    returned: { badge: "badge-warning", icon: CheckCircle, color: "#fbbf24" },
    completed: { badge: "badge-neutral", icon: CheckCircle, color: "#94a3b8" },
    cancelled: { badge: "badge-neutral", icon: XCircle, color: "#94a3b8" },
};

export default function RentalsPage() {
    const t = useTranslations("rentals");
    const tc = useTranslations("common");
    const locale = useLocale();
    const { profile } = useAuth();
    const { activeBranchId } = useLayout();

    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    // Multi-tenant filtering
    const isMultiTenant = profile?.role === "admin" || profile?.role === "owner";
    const branchId = isMultiTenant ? (activeBranchId || undefined) : (profile?.branch_id ?? undefined);
    const { data: rentals, isLoading } = useRentals(branchId, statusFilter);
    const updateRental = useUpdateRental();

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));

    const handleReturn = async (id: string) => {
        await updateRental.mutateAsync({ id, status: "returned", returned_date: new Date().toISOString() });
    };

    const openEdit = (rental: any) => {
        const notes = rental.notes ? (typeof rental.notes === "string" ? (() => { try { return JSON.parse(rental.notes); } catch { return {}; } })() : rental.notes) : {};
        setEditingId(rental.id);
        setEditForm({
            status: rental.status,
            deposit_paid: rental.deposit_paid || 0,
            rental_fee: rental.rental_fee || 0,
            overdue_fee: rental.overdue_fee || 0,
            start_date: rental.start_date?.split("T")[0] || "",
            due_date: rental.due_date?.split("T")[0] || "",
            returned_date: rental.returned_date?.split("T")[0] || "",
            customer_name: notes.customer_name || "",
            customer_phone: notes.customer_phone || "",
            customer_id_number: notes.customer_id_number || "",
            remarks: notes.remarks || "",
        });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        const notesObj = { customer_name: editForm.customer_name, customer_phone: editForm.customer_phone, customer_id_number: editForm.customer_id_number, remarks: editForm.remarks };
        await updateRental.mutateAsync({
            id: editingId,
            status: editForm.status,
            deposit_paid: Number(editForm.deposit_paid),
            rental_fee: Number(editForm.rental_fee),
            overdue_fee: Number(editForm.overdue_fee),
            start_date: editForm.start_date ? new Date(editForm.start_date).toISOString() : undefined,
            due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : undefined,
            returned_date: editForm.returned_date ? new Date(editForm.returned_date).toISOString() : null,
            notes: JSON.stringify(notesObj),
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                    <CalendarClock size={22} style={{ color: "var(--color-brand-400)" }} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{rentals?.length || 0} {locale === "ar" ? "إيجار" : "rentals"}</p>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--color-surface-900)" }}>
                {["all", "booked", "active", "overdue", "returned", "completed"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{
                        background: statusFilter === s ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "transparent",
                        color: statusFilter === s ? "white" : "var(--color-surface-400)",
                    }}>
                        {s === "all" ? (locale === "ar" ? "الكل" : "All") : t(`status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
            ) : !rentals || rentals.length === 0 ? (
                <div className="card text-center py-12">
                    <CalendarClock size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{tc("noData")}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-surface-500)" }}>{locale === "ar" ? "أنشئ إيجار من نقطة البيع" : "Create rentals from the POS page"}</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {rentals.map((rental: any) => {
                        const status = rental.status as string;
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.booked;
                        const StatusIcon = config.icon;
                        const customer = rental.customers;
                        const item = rental.inventory_items;
                        const notes = rental.notes ? (() => { try { return typeof rental.notes === "string" ? JSON.parse(rental.notes) : rental.notes; } catch { return {}; } })() : {};
                        const isEditing = editingId === rental.id;
                        const isLocked = rental.is_locked;

                        return (
                            <div key={rental.id} className="card" style={{ padding: "1.25rem" }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${config.color}18`, color: config.color }}>
                                            <StatusIcon size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-white">
                                                {notes.customer_name || customer?.full_name || (locale === "ar" ? "عميل غير محدد" : "Unknown Customer")}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: "var(--color-surface-400)" }}>
                                                {(notes.customer_phone || customer?.phone) && <span className="flex items-center gap-1"><Phone size={11} />{notes.customer_phone || customer?.phone}</span>}
                                                {notes.customer_id_number && <span className="flex items-center gap-1"><CreditCard size={11} />{notes.customer_id_number}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${config.badge} flex items-center gap-1`}>
                                            <StatusIcon size={12} />
                                            {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                                        </span>
                                        {!isLocked && !isEditing && (
                                            <button onClick={() => openEdit(rental)} className="p-1.5 rounded-lg" style={{ background: "var(--color-surface-700)" }}>
                                                <Pencil size={13} style={{ color: "var(--color-brand-400)" }} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl mb-3 flex items-center justify-between" style={{ background: "var(--color-surface-800)" }}>
                                    <div>
                                        <p className="text-sm font-medium text-white">{locale === "ar" ? item?.name_ar : item?.name}</p>
                                        {item?.sku && <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-surface-500)" }}>{item.sku}</p>}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="grid grid-cols-3 gap-3 mb-3 text-center text-xs">
                                    <div className="p-2 rounded-lg" style={{ background: "var(--color-surface-800)" }}>
                                        <p style={{ color: "var(--color-surface-400)" }}>{t("startDate")}</p>
                                        <p className="text-white font-medium mt-1">{formatDate(rental.start_date)}</p>
                                    </div>
                                    <div className="p-2 rounded-lg" style={{ background: status === "overdue" ? "rgba(239,68,68,0.1)" : "var(--color-surface-800)" }}>
                                        <p style={{ color: status === "overdue" ? "#f87171" : "var(--color-surface-400)" }}>{t("dueDate")}</p>
                                        <p className="font-medium mt-1" style={{ color: status === "overdue" ? "#f87171" : "white" }}>{formatDate(rental.due_date)}</p>
                                    </div>
                                    <div className="p-2 rounded-lg" style={{ background: rental.returned_date ? "rgba(16,185,129,0.1)" : "var(--color-surface-800)" }}>
                                        <p style={{ color: rental.returned_date ? "#34d399" : "var(--color-surface-400)" }}>{t("returnDate")}</p>
                                        <p className="font-medium mt-1" style={{ color: rental.returned_date ? "#34d399" : "var(--color-surface-500)" }}>
                                            {rental.returned_date ? formatDate(rental.returned_date) : "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Fees */}
                                <div className="flex gap-4 text-sm mb-3">
                                    <div><span style={{ color: "var(--color-surface-400)" }}>{t("deposit")}: </span><span className="text-white font-medium">{formatCurrency(rental.deposit_paid)}</span></div>
                                    <div><span style={{ color: "var(--color-surface-400)" }}>{t("rentalFee")}: </span><span className="text-white font-medium">{formatCurrency(rental.rental_fee)}</span></div>
                                    {rental.overdue_fee > 0 && <div><span style={{ color: "#f87171" }}>{t("overdueFee")}: </span><span style={{ color: "#f87171" }} className="font-medium">{formatCurrency(rental.overdue_fee)}</span></div>}
                                </div>

                                {/* Remarks */}
                                {notes.remarks && <p className="text-xs p-2 rounded-lg mb-3" style={{ background: "var(--color-surface-800)", color: "var(--color-surface-300)" }}>📝 {notes.remarks}</p>}

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    {(status === "active" || status === "overdue") && !isEditing && (
                                        <button onClick={() => handleReturn(rental.id)} className="btn btn-primary btn-sm w-full" disabled={updateRental.isPending}>
                                            {updateRental.isPending ? <Loader2 size={14} className="animate-spin" /> : null} {t("returnItem")}
                                        </button>
                                    )}
                                    {/* Send WhatsApp Invoice */}
                                    {(notes.customer_phone || customer?.phone) && !isEditing && (
                                        <a
                                            href={`https://wa.me/${(notes.customer_phone || customer?.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                                                locale === "ar"
                                                    ? `البارحي - فاتورة إيجار\n----------------------------------\nمرحباً ${notes.customer_name || customer?.full_name || 'عميلنا العزيز'}، شكرًا لتسوقك من\nالبارحي!\n\nالنوع: إيجار 📌\nالتاريخ: ${formatDate(rental.start_date)} 📅\nالعميل: ${notes.customer_name || customer?.full_name || '—'} 👤\nالهاتف: ${notes.customer_phone || customer?.phone || '—'} 📞\n\nالقطعة المستأجرة: 📦\n🧥 ${item?.name_ar || item?.name} × 1 = ${rental.rental_fee} ر.ع\n\nتاريخ الإرجاع المحدد: ${formatDate(rental.due_date)} ⏰\n\nالمجموع الفرعي: ${rental.rental_fee} ر.ع 💰\nالخصم: 0 ر.ع 🏷️\nالإجمالي: ${rental.rental_fee} ر.ع ✅\n\n----------------------------------\n⚠️ تنبيه تأخير الإرجاع:\nفي حال التأخر عن موعد الإرجاع، سيتم احتساب غرامة يومية تعادل قيمة إيجار القطعة لكل يوم تأخير إضافي.\n\n----------------------------------\nشكراً لاختياركم البارحي! 🙏\n\nنسعد بخدمتكم دائماً`
                                                    : `Al Barhi - Rental Invoice\n----------------------------------\nWelcome ${notes.customer_name || customer?.full_name || 'Valued Customer'}, thank you for shopping at\nAl Barhi!\n\nType: Rental 📌\nDate: ${formatDate(rental.start_date)} 📅\nCustomer: ${notes.customer_name || customer?.full_name || '—'} 👤\nPhone: ${notes.customer_phone || customer?.phone || '—'} 📞\n\nRented Item: 📦\n🧥 ${item?.name || item?.name_ar} × 1 = ${rental.rental_fee} OMR\n\nDue Date: ${formatDate(rental.due_date)} ⏰\n\nSubtotal: ${rental.rental_fee} OMR 💰\nDiscount: 0 OMR 🏷️\nTotal: ${rental.rental_fee} OMR ✅\n\n----------------------------------\n⚠️ Overdue Notice:\nIf the item is not returned by the due date, a daily penalty equal to the item's rental price will be charged for each additional day.\n\n----------------------------------\nThank you for choosing Al Barhi! 🙏\n\nAlways happy to serve you`
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-all hover:bg-opacity-90 mt-1"
                                            style={{ background: "rgba(37, 211, 102, 0.15)", color: "#25D366", border: "1px solid rgba(37, 211, 102, 0.2)" }}
                                        >
                                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                            {locale === "ar" ? "إرسال الفاتورة عبر واتساب" : "Send WhatsApp Invoice"}
                                        </a>
                                    )}
                                </div>

                                {/* Inline Edit */}
                                {isEditing && (
                                    <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--color-surface-700)" }}>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الحالة" : "Status"}</label>
                                                <select className="input" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                                    {["booked", "active", "overdue", "returned", "completed", "cancelled"].map(s => (<option key={s} value={s}>{t(`status${s.charAt(0).toUpperCase() + s.slice(1)}`)}</option>))}
                                                </select></div>
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{t("startDate")}</label>
                                                <input className="input" type="date" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} /></div>
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{t("dueDate")}</label>
                                                <input className="input" type="date" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "اسم العميل" : "Customer Name"}</label>
                                                <input className="input" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} /></div>
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "رقم الهاتف" : "Phone"}</label>
                                                <input className="input" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.customer_phone} onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })} /></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{t("deposit")}</label>
                                                <input className="input" type="number" step="0.001" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.deposit_paid} onChange={(e) => setEditForm({ ...editForm, deposit_paid: e.target.value })} /></div>
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{t("rentalFee")}</label>
                                                <input className="input" type="number" step="0.001" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.rental_fee} onChange={(e) => setEditForm({ ...editForm, rental_fee: e.target.value })} /></div>
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{t("overdueFee")}</label>
                                                <input className="input" type="number" step="0.001" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.overdue_fee} onChange={(e) => setEditForm({ ...editForm, overdue_fee: e.target.value })} /></div>
                                        </div>
                                        <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "ملاحظات" : "Remarks"}</label>
                                            <input className="input" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} /></div>
                                        {editForm.status === "returned" && (
                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "تاريخ الإرجاع الفعلي" : "Actual Return Date"}</label>
                                                <input className="input" type="date" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem" }} value={editForm.returned_date} onChange={(e) => setEditForm({ ...editForm, returned_date: e.target.value })} /></div>
                                        )}
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveEdit} className="btn btn-sm flex-1" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }} disabled={updateRental.isPending}>
                                                {updateRental.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} {tc("save")}
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm"><X size={14} /> {tc("cancel")}</button>
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
