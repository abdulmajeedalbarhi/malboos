"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory, useCreateTransaction, useCreateRental } from "@/hooks/useSupabase";
import {
    ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote,
    ArrowRightLeft, CalendarClock, Loader2, CheckCircle, X, Tag,
} from "lucide-react";

interface CartItem {
    id: string;
    name: string;
    name_ar: string;
    price: number;
    quantity: number;
    inventory_item_id: string;
    item_type: string;
}

export default function POSPage() {
    const t = useTranslations("pos");
    const tc = useTranslations("common");
    const locale = useLocale();
    const { profile } = useAuth();

    const branchId = profile?.branch_id ?? undefined;
    const { data: inventory, isLoading } = useInventory(branchId);
    const createTransaction = useCreateTransaction();
    const createRental = useCreateRental();

    // POS Mode
    const [mode, setMode] = useState<"sale" | "rental">("sale");

    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
    const [discount, setDiscount] = useState<number>(0);

    // Inline customer info
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    // Rental-specific fields
    const [customerId, setCustomerId] = useState(""); // Civil ID
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
    const [returnDate, setReturnDate] = useState("");
    const [rentalRemarks, setRentalRemarks] = useState("");

    // UI state
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [lastCheckout, setLastCheckout] = useState<any>(null);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 1 }).format(amount);

    // Filter items based on mode + search
    const availableItems = inventory?.filter((item: Record<string, unknown>) => {
        const itemType = item.item_type as string;
        const matchesMode = mode === "sale"
            ? (itemType === "sale" || itemType === "both")
            : (itemType === "rental" || itemType === "both");
        const isAvailable = item.status === "available" && (item.quantity as number) > 0;
        const matchesSearch = !searchQuery ||
            (item.name as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.name_ar as string).includes(searchQuery) ||
            (item.sku as string).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMode && isAvailable && matchesSearch;
    }) || [];

    const addToCart = (product: Record<string, unknown>) => {
        // For rental mode, only allow 1 quantity per item
        const existing = cart.find((c) => c.inventory_item_id === (product.id as string));
        if (existing && mode === "sale") {
            setCart(cart.map((c) => c.inventory_item_id === (product.id as string) ? { ...c, quantity: c.quantity + 1 } : c));
        } else if (!existing) {
            setCart([...cart, {
                id: crypto.randomUUID(),
                name: product.name as string,
                name_ar: product.name_ar as string,
                price: mode === "sale" ? (product.sale_price as number) : (product.rental_price_daily as number),
                quantity: 1,
                inventory_item_id: product.id as string,
                item_type: mode,
            }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map((c) => c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
    };

    const removeItem = (id: string) => setCart(cart.filter((c) => c.id !== id));

    const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

    // Calculate rental days (kept for UI duration display if needed)
    const rentalDays = bookingDate && returnDate
        ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(bookingDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

    // Price is flat per item quantity, regardless of duration
    const baseTotal = subtotal;
    const total = Math.max(0, baseTotal - discount);

    const handleCheckout = async () => {
        if (!branchId || !profile?.id || cart.length === 0) return;

        try {
            // Import supabase locally for the customer insertion
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();

            let finalCustomerId = null;
            if (customerName) {
                const { data: newCust, error: custErr } = await supabase
                    .from("customers")
                    .insert({ full_name: customerName, phone: customerPhone || "—", id_number: customerId || null })
                    .select().single();
                if (!custErr && newCust) {
                    finalCustomerId = newCust.id;
                }
            }

            if (mode === "rental" && !finalCustomerId) {
                alert(locale === "ar" ? "يجب إدخال بيانات العميل (الاسم على الأقل) لإتمام الإيجار" : "Customer name is required for rentals.");
                return;
            }

            if (mode === "sale") {
                // Create sale transaction
                await createTransaction.mutateAsync({
                    transaction: {
                        branch_id: branchId,
                        cashier_id: profile.id,
                        customer_id: finalCustomerId,
                        type: "sale",
                        total_amount: subtotal,
                        discount: discount,
                        final_amount: total,
                        payment_method: paymentMethod,
                        notes: customerName ? `${customerName} - ${customerPhone}` : null,
                        is_locked: false,
                    },
                    items: cart.map((c) => ({
                        inventory_item_id: c.inventory_item_id,
                        quantity: c.quantity,
                        unit_price: c.price,
                        subtotal: c.price * c.quantity,
                    })),
                });
                setSuccessMessage(locale === "ar" ? "تم البيع بنجاح!" : "Sale completed!");
            } else {
                // Create rental for each cart item
                for (const item of cart) {
                    await createRental.mutateAsync({
                        branch_id: branchId,
                        customer_id: finalCustomerId,
                        inventory_item_id: item.inventory_item_id,
                        cashier_id: profile.id,
                        start_date: new Date(bookingDate).toISOString(),
                        due_date: new Date(returnDate).toISOString(),
                        returned_date: null,
                        status: "active",
                        deposit_paid: 0,
                        rental_fee: item.price,
                        overdue_fee: 0,
                        notes: JSON.stringify({
                            customer_name: customerName,
                            customer_phone: customerPhone,
                            customer_id_number: customerId,
                            remarks: rentalRemarks,
                            payment_method: paymentMethod,
                        }),
                        reminder_sent: false,
                        is_locked: false,
                    });
                }

                // Create transaction for the rental to reflect in revenue
                await createTransaction.mutateAsync({
                    transaction: {
                        branch_id: branchId,
                        cashier_id: profile.id,
                        customer_id: finalCustomerId,
                        type: "rental_payment",
                        total_amount: subtotal,
                        discount: discount,
                        final_amount: total,
                        payment_method: paymentMethod,
                        notes: `Rental - ${customerName ? customerName : ''}`,
                        is_locked: false,
                    },
                    items: cart.map((c) => ({
                        inventory_item_id: c.inventory_item_id,
                        quantity: c.quantity,
                        unit_price: c.price,
                        subtotal: c.price * c.quantity,
                    })),
                });

                setSuccessMessage(locale === "ar" ? "تم تسجيل الإيجار بنجاح!" : "Rental registered!");
            }

            setLastCheckout({
                name: customerName,
                phone: customerPhone,
                mode: mode,
                total: total,
                subtotal: baseTotal,
                discount: discount,
                items: cart.map(c => ({
                    name: locale === "ar" ? c.name_ar : c.name,
                    qty: c.quantity,
                    price: c.price
                }))
            });

            // Reset form
            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setCustomerId("");
            setReturnDate("");
            setRentalRemarks("");
            setDiscount(0);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setLastCheckout(null);
            }, 8000);
        } catch (err) {
            console.error("Checkout failed:", err);
        }
    };

    const isProcessing = createTransaction.isPending || createRental.isPending;

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in" style={{ minHeight: "calc(100vh - var(--header-height) - 3rem)" }}>
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-20 inset-x-0 z-50 flex flex-col items-center gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg" style={{ background: "rgba(16, 185, 129, 0.95)", color: "white" }}>
                        <CheckCircle size={18} /> {successMessage}
                    </div>
                    {lastCheckout && lastCheckout.phone && (
                        <a
                            href={`https://wa.me/${lastCheckout.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                locale === "ar"
                                    ? `البارحي - فاتورة\n----------------------------------\nمرحباً ${lastCheckout.name || 'عميلنا العزيز'}، شكرًا لتسوقك من\nالبارحي!\n\nالنوع: ${lastCheckout.mode === 'sale' ? 'بيع' : 'إيجار'} 📌\nالتاريخ: ${new Intl.DateTimeFormat('en-OM', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date())} 📅\nالعميل: ${lastCheckout.name || '—'} 👤\nالهاتف: ${lastCheckout.phone || '—'} 📞\n\nالمنتجات: 📦\n${lastCheckout.items.map((i: any, idx: number) => `${idx + 1}. 🧥 ${i.name} × ${i.qty} = ${i.price * i.qty} ر.ع`).join('\n')}\n\nالمجموع الفرعي: ${lastCheckout.subtotal} ر.ع 💰\nالخصم: -${lastCheckout.discount} ر.ع 🏷️\nالإجمالي: ${lastCheckout.total} ر.ع ✅\n\n----------------------------------\n${lastCheckout.mode === 'rental' ? '⚠️ تنبيه تأخير الإرجاع:\nفي حال التأخر عن موعد الإرجاع، سيتم احتساب غرامة يومية تعادل قيمة إيجار القطعة لكل يوم تأخير إضافي.\n\n----------------------------------\n' : ''}شكراً لاختياركم البارحي! 🙏\n\nنسعد بخدمتكم دائماً`
                                    : `Al Barhi - Invoice\n----------------------------------\nWelcome ${lastCheckout.name || 'Valued Customer'}, thank you for shopping at\nAl Barhi!\n\nType: ${lastCheckout.mode === 'sale' ? 'Sale' : 'Rental'} 📌\nDate: ${new Intl.DateTimeFormat('en-OM', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date())} 📅\nCustomer: ${lastCheckout.name || '—'} 👤\nPhone: ${lastCheckout.phone || '—'} 📞\n\nItems: 📦\n${lastCheckout.items.map((i: any, idx: number) => `${idx + 1}. 🧥 ${i.name} × ${i.qty} = ${i.price * i.qty} OMR`).join('\n')}\n\nSubtotal: ${lastCheckout.subtotal} OMR 💰\nDiscount: -${lastCheckout.discount} OMR 🏷️\nTotal: ${lastCheckout.total} OMR ✅\n\n----------------------------------\n${lastCheckout.mode === 'rental' ? '⚠️ Overdue Notice:\nIf the item is not returned by the due date, a daily penalty equal to the item\'s rental price will be charged for each additional day.\n\n----------------------------------\n' : ''}Thank you for choosing Al Barhi! 🙏\n\nAlways happy to serve you`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg font-medium transition-all hover:scale-105"
                            style={{ background: "#25D366", color: "white", textDecoration: "none" }}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                            إرسال الفاتورة عبر واتساب
                        </a>
                    )}
                </div>
            )}

            {/* Product Grid */}
            <div className="flex-1 space-y-4">
                {/* Header + Mode Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                            {mode === "sale" ? <ShoppingCart size={22} style={{ color: "var(--color-brand-400)" }} /> : <CalendarClock size={22} style={{ color: "var(--color-brand-400)" }} />}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
                    </div>

                    {/* Sale / Rent Toggle */}
                    <div className="flex p-1 rounded-xl w-full sm:w-auto" style={{ background: "var(--color-surface-900)" }}>
                        <button onClick={() => { setMode("sale"); setCart([]); }} className="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2" style={{
                            background: mode === "sale" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                            color: mode === "sale" ? "white" : "var(--color-surface-400)",
                        }}>
                            <Tag size={16} /> {locale === "ar" ? "بيع" : "Sale"}
                        </button>
                        <button onClick={() => { setMode("rental"); setCart([]); }} className="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2" style={{
                            background: mode === "rental" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
                            color: mode === "rental" ? "white" : "var(--color-surface-400)",
                        }}>
                            <CalendarClock size={16} /> {locale === "ar" ? "إيجار" : "Rental"}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute top-1/2 -translate-y-1/2" style={{ color: "var(--color-surface-400)", insetInlineStart: "0.75rem" }} />
                    <input type="text" className="input" placeholder={tc("search") + "..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingInlineStart: "2.25rem" }} />
                </div>

                {/* Product Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
                ) : availableItems.length === 0 ? (
                    <div className="card text-center py-12">
                        <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                        <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>
                            {locale === "ar" ? "لا توجد أصناف متاحة" : "No items available"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-surface-500)" }}>
                            {locale === "ar" ? `أضف أصناف من نوع "${mode === "sale" ? "بيع" : "إيجار"}" من صفحة المخزون` : `Add items with type "${mode}" from Inventory page`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {availableItems.map((product: Record<string, unknown>) => {
                            const isInCart = cart.some((c) => c.inventory_item_id === (product.id as string));
                            return (
                                <div key={product.id as string} className="card transition-all" style={{
                                    padding: "1rem",
                                    border: isInCart ? "1px solid var(--color-brand-500)" : undefined,
                                }}>
                                    <h3 className="text-sm font-semibold text-white mb-1">
                                        {locale === "ar" ? product.name_ar as string : product.name as string}
                                    </h3>
                                    <p className="text-xs font-mono mb-1" style={{ color: "var(--color-surface-500)" }}>{product.sku as string}</p>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-bold" style={{ color: "var(--color-brand-400)" }}>
                                            {mode === "sale"
                                                ? formatCurrency(product.sale_price as number)
                                                : formatCurrency(product.rental_price_daily as number)
                                            }
                                        </p>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{
                                            background: (product.item_type as string) === "both" ? "rgba(168, 85, 247, 0.15)" : mode === "sale" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                            color: (product.item_type as string) === "both" ? "#c084fc" : mode === "sale" ? "#34d399" : "#60a5fa",
                                        }}>
                                            {(product.item_type as string) === "both" ? (locale === "ar" ? "بيع+إيجار" : "Both") : mode === "sale" ? (locale === "ar" ? "بيع" : "Sale") : (locale === "ar" ? "إيجار" : "Rental")}
                                        </span>
                                    </div>
                                    <p className="text-xs mb-3" style={{ color: "var(--color-surface-400)" }}>
                                        {locale === "ar" ? "الكمية:" : "Qty:"} {product.quantity as number}
                                    </p>
                                    <button onClick={() => addToCart(product)} className="btn btn-primary btn-sm w-full" disabled={isInCart && mode === "rental"}>
                                        {isInCart ? (locale === "ar" ? "✓ في السلة" : "✓ In Cart") : <><Plus size={14} /> {t("addToCart")}</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col glass rounded-2xl lg:sticky" style={{ top: "calc(var(--header-height) + 1.5rem)", maxHeight: "calc(100vh - var(--header-height) - 3rem)" }}>
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.08)" }}>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        {mode === "sale" ? <ShoppingCart size={20} /> : <CalendarClock size={20} />}
                        {mode === "sale" ? t("cart") : (locale === "ar" ? "تفاصيل الإيجار" : "Rental Details")}
                        {cart.length > 0 && <span className="badge badge-info">{cart.length}</span>}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Cart Items */}
                    {cart.length === 0 ? (
                        <div className="text-center py-6" style={{ color: "var(--color-surface-500)" }}>
                            <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{locale === "ar" ? "أضف أصناف من القائمة" : "Add items from the grid"}</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="p-3 rounded-xl" style={{ background: "var(--color-surface-800)" }}>
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-medium text-white">{locale === "ar" ? item.name_ar : item.name}</p>
                                    <button onClick={() => removeItem(item.id)} className="p-1 rounded" style={{ color: "var(--color-danger)" }}><Trash2 size={14} /></button>
                                </div>
                                <div className="flex items-center justify-between">
                                    {mode === "sale" ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-surface-700)" }}><Minus size={12} className="text-white" /></button>
                                            <span className="text-sm font-medium text-white w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-surface-700)" }}><Plus size={12} className="text-white" /></button>
                                        </div>
                                    ) : (
                                        <span className="text-xs" style={{ color: "var(--color-surface-400)" }}>{formatCurrency(item.price)}</span>
                                    )}
                                    <span className="text-sm font-semibold text-white">
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Customer Info Section */}
                    {cart.length > 0 && (
                        <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--color-surface-700)" }}>
                            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-surface-400)" }}>
                                {locale === "ar" ? "بيانات العميل" : "Customer Info"}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الاسم" : "Name"}</label>
                                    <input className="input" style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={locale === "ar" ? "اسم العميل" : "Customer name"} />
                                </div>
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "رقم الهاتف" : "Phone"}</label>
                                    <input className="input" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+968 9XXX XXXX" />
                                </div>
                            </div>

                            {/* Extra rental fields */}
                            {mode === "rental" && (
                                <>
                                    <div>
                                        <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "رقم الهوية" : "ID Number"}</label>
                                        <input className="input" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="12345678" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "تاريخ الحجز" : "Booking Date"}</label>
                                            <input className="input" type="date" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "تاريخ الإرجاع" : "Return Date"} *</label>
                                            <input className="input" type="date" dir="ltr" style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
                                        </div>
                                    </div>
                                    {rentalDays > 0 && returnDate && (
                                        <div className="text-center p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                                            <span className="text-sm font-semibold" style={{ color: "#60a5fa" }}>
                                                {rentalDays} {locale === "ar" ? "يوم" : "days"}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "ملاحظات" : "Remarks"}</label>
                                        <textarea className="input" rows={2} style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} value={rentalRemarks} onChange={(e) => setRentalRemarks(e.target.value)} placeholder={locale === "ar" ? "ملاحظات إضافية..." : "Additional notes..."} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Checkout Footer */}
                {cart.length > 0 && (
                    <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(148, 163, 184, 0.08)" }}>
                        {/* Totals */}
                        <div className="space-y-1.5">
                            {mode === "rental" && returnDate && (
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "المدة" : "Duration"}</span>
                                    <span className="text-white">{rentalDays} {locale === "ar" ? "يوم" : "days"}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm pt-2" style={{ borderTop: "1px solid var(--color-surface-700)" }}>
                                <span style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                                <span className="text-white">{formatCurrency(baseTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الخصم" : "Discount"}</span>
                                <input className="input w-24 text-end" type="number" min="0" step="0.5" style={{ padding: "0.25rem 0.5rem", height: "auto" }} value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: "1px solid var(--color-surface-700)" }}>
                                <span className="text-white">{t("totalAmount")}</span>
                                <span style={{ color: "var(--color-brand-400)" }}>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="flex gap-2">
                            {([
                                { key: "cash" as const, icon: Banknote, label: t("cash") },
                                { key: "card" as const, icon: CreditCard, label: t("card") },
                                { key: "transfer" as const, icon: ArrowRightLeft, label: t("transfer") },
                            ]).map((pm) => (
                                <button key={pm.key} onClick={() => setPaymentMethod(pm.key)} className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all" style={{
                                    background: paymentMethod === pm.key ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "var(--color-surface-800)",
                                    color: paymentMethod === pm.key ? "white" : "var(--color-surface-400)",
                                    border: paymentMethod === pm.key ? "none" : "1px solid var(--color-surface-700)",
                                }}>
                                    <pm.icon size={14} /> {pm.label}
                                </button>
                            ))}
                        </div>

                        <button onClick={handleCheckout} className="w-full py-3 rounded-xl text-sm font-bold transition-all" disabled={isProcessing || (mode === "rental" && !returnDate)} style={{
                            background: mode === "sale" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            opacity: isProcessing || (mode === "rental" && !returnDate) ? 0.5 : 1,
                        }}>
                            {isProcessing ? <Loader2 size={18} className="animate-spin mx-auto" /> : mode === "sale" ? t("completeSale") : (locale === "ar" ? "تأكيد الإيجار" : "Confirm Rental")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
