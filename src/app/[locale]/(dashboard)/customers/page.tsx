"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCustomers, useAddCustomer, useUpdateCustomer } from "@/hooks/useSupabase";
import { createClient } from "@/lib/supabase/client";
import { Users, Search, Plus, Phone, CreditCard, Loader2, X, Pencil, Trash2 } from "lucide-react";

const supabase = createClient();

const EMPTY = { full_name: "", phone: "", id_number: "", address: "" };

export default function CustomersPage() {
    const t = useTranslations();
    const tc = useTranslations("common");
    const locale = useLocale();

    const { data: customers, isLoading, refetch } = useCustomers();
    const addCustomer = useAddCustomer();
    const updateCustomer = useUpdateCustomer();

    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY });

    const filtered = customers?.filter((c: any) =>
        !searchQuery || c.full_name.includes(searchQuery) || c.phone.includes(searchQuery) || c.id_number?.includes(searchQuery)
    ) || [];

    const openAdd = () => { setEditId(null); setFormData({ ...EMPTY }); setShowModal(true); };
    const openEdit = (c: any) => { setEditId(c.id); setFormData({ full_name: c.full_name, phone: c.phone, id_number: c.id_number || "", address: c.address || "" }); setShowModal(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { full_name: formData.full_name, phone: formData.phone, id_number: formData.id_number || null, id_image_url: null, address: formData.address || null };
            if (editId) {
                await updateCustomer.mutateAsync({ id: editId, ...payload });
            } else {
                await addCustomer.mutateAsync(payload);
            }
            setShowModal(false);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(locale === "ar" ? "حذف هذا العميل؟" : "Delete this customer?")) return;
        await supabase.from("customers").delete().eq("id", id);
        refetch();
    };

    const isPending = addCustomer.isPending || updateCustomer.isPending;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                        <Users size={22} style={{ color: "var(--color-brand-400)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t("nav.customers")}</h1>
                        <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{filtered.length} {locale === "ar" ? "عميل" : "customers"}</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> {locale === "ar" ? "إضافة عميل" : "Add Customer"}</button>
            </div>

            <div className="relative max-w-md">
                <Search size={16} className="absolute top-1/2 -translate-y-1/2" style={{ color: "var(--color-surface-400)", insetInlineStart: "0.75rem" }} />
                <input type="text" className="input" placeholder={tc("search") + "..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingInlineStart: "2.25rem" }} />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
            ) : filtered.length === 0 ? (
                <div className="card text-center py-12">
                    <Users size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{tc("noData")}</p>
                    <button className="btn btn-primary btn-sm mt-4" onClick={openAdd}><Plus size={16} /> {locale === "ar" ? "إضافة عميل" : "Add Customer"}</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
                    {filtered.map((customer: any) => (
                        <div key={customer.id} className="card cursor-pointer transition-all hover:border-[var(--color-brand-500)]/20" style={{ padding: "1.25rem" }} onClick={() => openEdit(customer)}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center w-11 h-11 rounded-full shrink-0 text-sm font-semibold" style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))", color: "white" }}>
                                        {customer.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-white">{customer.full_name}</h3>
                                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--color-surface-400)" }}>
                                            <Phone size={12} /> {customer.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => openEdit(customer)} className="p-1.5 rounded-lg" style={{ background: "var(--color-surface-700)" }}>
                                        <Pencil size={12} style={{ color: "var(--color-brand-400)" }} />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 rounded-lg" style={{ background: "var(--color-surface-700)" }}>
                                        <Trash2 size={12} style={{ color: "#f87171" }} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-sm">
                                {customer.id_number && (
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--color-surface-400)" }}><CreditCard size={13} className="inline me-1" />{locale === "ar" ? "رقم الهوية" : "ID"}</span>
                                        <span className="text-white font-mono text-xs">{customer.id_number}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "العنوان" : "Address"}</span>
                                        <span className="text-white text-xs">{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowModal(false)}>
                    <div className="glass rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editId ? (locale === "ar" ? "تعديل العميل" : "Edit Customer") : (locale === "ar" ? "إضافة عميل" : "Add Customer")}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1"><X size={20} style={{ color: "var(--color-surface-400)" }} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="label">{locale === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                                <input className="input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required /></div>
                            <div><label className="label">{locale === "ar" ? "رقم الهاتف" : "Phone"}</label>
                                <input className="input" dir="ltr" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="+968 9XXX XXXX" /></div>
                            <div><label className="label">{locale === "ar" ? "رقم الهوية" : "ID Number"}</label>
                                <input className="input" dir="ltr" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} /></div>
                            <div><label className="label">{locale === "ar" ? "العنوان" : "Address"}</label>
                                <input className="input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={isPending}>
                                    {isPending ? <Loader2 size={16} className="animate-spin" /> : editId ? <Pencil size={16} /> : <Plus size={16} />}
                                    {editId ? tc("save") : tc("add")}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">{tc("cancel")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
