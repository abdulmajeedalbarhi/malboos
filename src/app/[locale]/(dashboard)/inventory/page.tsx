"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory, useCategories, useAddInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from "@/hooks/useSupabase";
import { Package, Plus, Search, Loader2, Trash2, X, Pencil } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
    available: "badge-success", rented: "badge-info", sold: "badge-neutral", reserved: "badge-warning", damaged: "badge-danger",
};

const EMPTY_ITEM = {
    name: "", name_ar: "", sku: "", category_id: "", item_type: "sale" as "sale" | "rental" | "both",
    purchase_price: 0, sale_price: 0, rental_price_daily: 0, deposit_amount: 0,
    quantity: 1, status: "available" as const, is_high_value: false, description: "",
};

export default function InventoryPage() {
    const t = useTranslations("inventory");
    const tc = useTranslations("common");
    const locale = useLocale();
    const { profile } = useAuth();

    const branchId = profile?.branch_id ?? undefined;
    const { data: items, isLoading } = useInventory(branchId);
    const { data: categories } = useCategories();
    const addItem = useAddInventoryItem();
    const updateItem = useUpdateInventoryItem();
    const deleteItem = useDeleteInventoryItem();

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_ITEM });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }).format(amount);

    const filtered = items?.filter((item: any) => {
        const matchesSearch = !searchQuery ||
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name_ar?.includes(searchQuery) ||
            item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];

    const openAdd = () => { setEditId(null); setFormData({ ...EMPTY_ITEM }); setShowModal(true); };

    const openEdit = (item: any) => {
        setEditId(item.id);
        setFormData({
            name: item.name, name_ar: item.name_ar, sku: item.sku, category_id: item.category_id,
            item_type: item.item_type, purchase_price: item.purchase_price, sale_price: item.sale_price,
            rental_price_daily: item.rental_price_daily, deposit_amount: item.deposit_amount,
            quantity: item.quantity, status: item.status, is_high_value: item.is_high_value, description: item.description || "",
        });
        setShowModal(true);
    };

    const generateSKU = (categoryId: string) => {
        if (!categoryId || !categories || !items) return "";
        const cat = categories.find((c: any) => c.id === categoryId);
        if (!cat) return "";

        const prefixMap: Record<string, string> = {
            "Bisht": "BS",
            "Shaal": "SH",
            "Massar": "MS",
            "Khanjar": "KH",
            "Saif": "SF",
            "Kummah": "KM",
        };
        const prefix = prefixMap[cat.name] || cat.name.substring(0, 2).toUpperCase();

        const catItems = items.filter((i: any) => i.category_id === categoryId);
        let maxNum = 0;
        for (const item of catItems) {
            if (item.sku && item.sku.startsWith(prefix + "-")) {
                const num = parseInt(item.sku.substring(prefix.length + 1), 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
        return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) return;
        try {
            const payload = {
                ...formData,
                branch_id: branchId,
                image_urls: [],
                attributes: {},
                purchase_price: Number(formData.purchase_price),
                sale_price: Number(formData.sale_price),
                rental_price_daily: Number(formData.rental_price_daily),
                deposit_amount: Number(formData.deposit_amount),
                quantity: Number(formData.quantity),
            };
            if (editId) {
                await updateItem.mutateAsync({ id: editId, ...payload });
            } else {
                await addItem.mutateAsync(payload);
            }
            setShowModal(false);
        } catch (err) { console.error(err); }
    };

    const isPending = addItem.isPending || updateItem.isPending;

    const typeLabel = (t: string) => ({
        sale: locale === "ar" ? "بيع" : "Sale",
        rental: locale === "ar" ? "إيجار" : "Rental",
        both: locale === "ar" ? "بيع+إيجار" : "Both",
    }[t] || t);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                        <Package size={22} style={{ color: "var(--color-brand-400)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
                        <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{filtered.length} {locale === "ar" ? "صنف" : "items"}</p>
                    </div>
                </div>
            </div>

            {/* Actions: Search and Add Item */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute top-1/2 -translate-y-1/2" style={{ color: "var(--color-surface-400)", insetInlineStart: "0.75rem" }} />
                    <input type="text" className="input" placeholder={tc("search") + "..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingInlineStart: "2.25rem" }} />
                </div>
                <button className="btn btn-primary sm:w-auto w-full" onClick={openAdd}>
                    <Plus size={18} /> {t("addItem")}
                </button>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setCategoryFilter("all")} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{
                    background: categoryFilter === "all" ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "var(--color-surface-800)",
                    color: categoryFilter === "all" ? "white" : "var(--color-surface-300)", border: categoryFilter === "all" ? "none" : "1px solid var(--color-surface-700)",
                }}>{locale === "ar" ? "الكل" : "All"}</button>
                {categories?.map((cat: any) => (
                    <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{
                        background: categoryFilter === cat.id ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "var(--color-surface-800)",
                        color: categoryFilter === cat.id ? "white" : "var(--color-surface-300)", border: categoryFilter === cat.id ? "none" : "1px solid var(--color-surface-700)",
                    }}>{locale === "ar" ? cat.name_ar : cat.name}</button>
                ))}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
            ) : filtered.length === 0 ? (
                <div className="card text-center py-12">
                    <Package size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{tc("noData")}</p>
                    <button className="btn btn-primary btn-sm mt-4" onClick={openAdd}><Plus size={16} /> {t("addItem")}</button>
                </div>
            ) : (
                <div className="card overflow-hidden" style={{ padding: 0 }}>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: "var(--color-surface-800)", borderBottom: "1px solid var(--color-surface-700)" }}>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{t("sku")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{t("itemName")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{t("category")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "النوع" : "Type"}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{t("salePrice")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{t("rentalPrice")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{t("quantity")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{tc("status")}</th>
                                    <th className="text-start p-3.5 font-medium" style={{ color: "var(--color-surface-400)" }}>{tc("actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item: any) => (
                                    <tr key={item.id} className="transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderBottom: "1px solid var(--color-surface-800)" }} onClick={() => openEdit(item)}>
                                        <td className="p-3.5 font-mono text-xs" style={{ color: "var(--color-surface-400)" }}>{item.sku}</td>
                                        <td className="p-3.5 font-medium text-white">{locale === "ar" ? item.name_ar : item.name}</td>
                                        <td className="p-3.5" style={{ color: "var(--color-surface-300)" }}>{locale === "ar" ? item.categories?.name_ar : item.categories?.name}</td>
                                        <td className="p-3.5">
                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                                background: item.item_type === "both" ? "rgba(168,85,247,0.15)" : item.item_type === "sale" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                                                color: item.item_type === "both" ? "#c084fc" : item.item_type === "sale" ? "#34d399" : "#60a5fa",
                                            }}>{typeLabel(item.item_type)}</span>
                                        </td>
                                        <td className="p-3.5 text-white">{formatCurrency(item.sale_price)}</td>
                                        <td className="p-3.5" style={{ color: "var(--color-surface-300)" }}>{item.rental_price_daily > 0 ? formatCurrency(item.rental_price_daily) : "—"}</td>
                                        <td className="p-3.5 text-white">{item.quantity}</td>
                                        <td className="p-3.5"><span className={`badge ${STATUS_BADGE[item.status] || "badge-neutral"}`}>{t(item.status)}</span></td>
                                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg transition-all" style={{ background: "var(--color-surface-700)" }}>
                                                    <Pencil size={13} style={{ color: "var(--color-brand-400)" }} />
                                                </button>
                                                <button onClick={() => { if (confirm(locale === "ar" ? "حذف هذا الصنف؟" : "Delete this item?")) deleteItem.mutate(item.id); }} className="p-1.5 rounded-lg transition-all" style={{ background: "var(--color-surface-700)" }}>
                                                    <Trash2 size={13} style={{ color: "#f87171" }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col divide-y" style={{ borderColor: "var(--color-surface-800)" }}>
                        {filtered.map((item: any) => (
                            <div key={item.id} className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => openEdit(item)}>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold text-white leading-tight mb-1">{locale === "ar" ? item.name_ar : item.name}</h3>
                                        <span className="font-mono text-[10px]" style={{ color: "var(--color-surface-400)" }}>{item.sku}</span>
                                    </div>
                                    <span className={`badge ${STATUS_BADGE[item.status] || "badge-neutral"} shrink-0`}>{t(item.status)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                                                background: item.item_type === "both" ? "rgba(168,85,247,0.15)" : item.item_type === "sale" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                                                color: item.item_type === "both" ? "#c084fc" : item.item_type === "sale" ? "#34d399" : "#60a5fa",
                                            }}>{typeLabel(item.item_type)}</span>
                                            <span className="text-xs" style={{ color: "var(--color-surface-400)" }}>
                                                {locale === "ar" ? item.categories?.name_ar : item.categories?.name}
                                            </span>
                                        </div>
                                        <span className="text-xs" style={{ color: "var(--color-surface-400)" }}>{t("quantity")}: <span className="text-white font-medium">{item.quantity}</span></span>
                                    </div>
                                    <div className="font-bold text-sm whitespace-nowrap text-end" style={{ color: "var(--color-brand-400)" }}>
                                        {formatCurrency(item.sale_price)}
                                        {item.rental_price_daily > 0 && (
                                            <div className="text-[10px] font-normal" style={{ color: "var(--color-surface-400)" }}>
                                                {formatCurrency(item.rental_price_daily)}/{locale === "ar" ? "يوم" : "day"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowModal(false)}>
                    <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editId ? t("editItem") : t("addItem")}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg" style={{ color: "var(--color-surface-400)" }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">{locale === "ar" ? "الاسم (English)" : "Name (English)"}</label>
                                    <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                                <div><label className="label">{locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</label>
                                    <input className="input" dir="rtl" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">{t("sku")}</label>
                                    <input className="input" dir="ltr" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required /></div>
                                <div><label className="label">{t("category")}</label>
                                    <select className="input" value={formData.category_id} onChange={(e) => {
                                        const catId = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            category_id: catId,
                                            sku: editId ? prev.sku : generateSKU(catId)
                                        }));
                                    }} required>
                                        <option value="">{locale === "ar" ? "اختر..." : "Select..."}</option>
                                        {categories?.map((cat: any) => (<option key={cat.id} value={cat.id}>{locale === "ar" ? cat.name_ar : cat.name}</option>))}
                                    </select></div>
                            </div>
                            <div>
                                <label className="label">{locale === "ar" ? "نوع الصنف" : "Item Type"}</label>
                                <div className="flex gap-2">
                                    {(["sale", "rental", "both"] as const).map(it => (
                                        <button key={it} type="button" onClick={() => setFormData({ ...formData, item_type: it })} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all" style={{
                                            background: formData.item_type === it ? (it === "sale" ? "linear-gradient(135deg, #10b981, #059669)" : it === "rental" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "linear-gradient(135deg, #a855f7, #7c3aed)") : "var(--color-surface-800)",
                                            color: formData.item_type === it ? "white" : "var(--color-surface-400)", border: formData.item_type === it ? "none" : "1px solid var(--color-surface-700)",
                                        }}>{typeLabel(it)}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">{t("salePrice")} (OMR)</label>
                                    <input className="input" type="number" step="0.001" dir="ltr" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label className="label">{t("rentalPrice")} (OMR)</label>
                                    <input className="input" type="number" step="0.001" dir="ltr" value={formData.rental_price_daily} onChange={(e) => setFormData({ ...formData, rental_price_daily: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><label className="label">{t("depositAmount")}</label>
                                    <input className="input" type="number" step="0.001" dir="ltr" value={formData.deposit_amount} onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label className="label">{t("quantity")}</label>
                                    <input className="input" type="number" dir="ltr" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} /></div>
                                <div><label className="label">{locale === "ar" ? "سعر الشراء" : "Cost"}</label>
                                    <input className="input" type="number" step="0.001" dir="ltr" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            {editId && (
                                <div><label className="label">{tc("status")}</label>
                                    <select className="input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                                        {["available", "rented", "sold", "reserved", "damaged"].map(s => (
                                            <option key={s} value={s}>{t(s)}</option>
                                        ))}
                                    </select></div>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="hv" checked={formData.is_high_value} onChange={(e) => setFormData({ ...formData, is_high_value: e.target.checked })} />
                                <label htmlFor="hv" className="text-sm" style={{ color: "var(--color-surface-300)" }}>{t("highValue")}</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={isPending}>
                                    {isPending ? <Loader2 size={16} className="animate-spin" /> : editId ? <Pencil size={16} /> : <Plus size={16} />}
                                    {editId ? tc("save") : t("addItem")}
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
