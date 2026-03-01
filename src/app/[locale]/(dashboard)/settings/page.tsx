"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/hooks/useSupabase";
import { createClient } from "@/lib/supabase/client";
import {
    Settings, Users, Shield, Building2, Globe, Loader2, Plus, X,
    Pencil, Trash2, UserPlus, CheckCircle, ChevronDown, ChevronUp,
} from "lucide-react";

const supabase = createClient();

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROLES = [
    { value: "cashier", en: "Cashier", ar: "أمين الصندوق" },
    { value: "branch_manager", en: "Branch Manager", ar: "مدير الفرع" },
    { value: "owner", en: "Owner", ar: "المالك" },
    { value: "admin", en: "System Admin", ar: "مدير النظام" },
];

export default function SettingsPage() {
    const locale = useLocale();
    const { profile } = useAuth();
    const { data: branches } = useBranches();

    const [activeSection, setActiveSection] = useState("users");

    // Users state
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newUser, setNewUser] = useState({ full_name: "", username: "", password: "", phone: "", role: "cashier", branch_id: "" });
    const [editUser, setEditUser] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Branches state
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: "", name_ar: "", phone: "", address: "" });

    // Fetch user profiles
    const fetchUsers = async () => {
        setLoadingUsers(true);
        const { data } = await supabase.from("user_profiles").select("*, branches(name, name_ar)").order("created_at", { ascending: false });
        setUsers(data || []);
        setLoadingUsers(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 1. We must isolate the auth client so we don't log out the admin
            const { createClient: createSupClient } = await import("@supabase/supabase-js");
            const tempClient = createSupClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { auth: { persistSession: false, autoRefreshToken: false } }
            );

            // 2. Sign up the user in Supabase Auth
            const syntheticEmail = `${newUser.username.trim().toLowerCase()}@malboos.com`;
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: syntheticEmail,
                password: newUser.password,
            });

            if (authError) throw authError;

            const authUserId = authData.user?.id;
            if (!authUserId) throw new Error("Failed to create auth user");

            // Wait 1 second to allow the DB trigger to create the user_profile
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 3. Update the newly created profile with the role, branch, and phone
            const { error: profileError } = await supabase.from("user_profiles").update({
                full_name: newUser.full_name,
                role: newUser.role,
                branch_id: newUser.branch_id || null,
                phone: newUser.phone || null,
            }).eq("auth_user_id", authUserId);

            if (profileError) {
                // If trigger didn't exist, we insert manually
                const { error: insertErr } = await supabase.from("user_profiles").insert({
                    auth_user_id: authUserId,
                    full_name: newUser.full_name,
                    role: newUser.role,
                    branch_id: newUser.branch_id || null,
                    phone: newUser.phone || null,
                });
                if (insertErr) throw insertErr;
            }

            setShowAddUser(false);
            setNewUser({ full_name: "", username: "", password: "", phone: "", role: "cashier", branch_id: "" });
            showSuccess(locale === "ar" ? "تم إضافة المستخدم بنجاح" : "User added successfully");
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            alert(locale === "ar" ? "خطأ أثناء إضافة المستخدم: " + err.message : "Error adding user: " + err.message);
        }
        setSaving(false);
    };

    const handleUpdateUser = async () => {
        if (!editingUserId) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("user_profiles").update({
                full_name: editUser.full_name, role: editUser.role, branch_id: editUser.branch_id || null, phone: editUser.phone,
            }).eq("id", editingUserId);
            if (error) throw error;
            setEditingUserId(null);
            showSuccess(locale === "ar" ? "تم تحديث المستخدم" : "User updated");
            fetchUsers();
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm(locale === "ar" ? "حذف هذا المستخدم؟" : "Delete this user?")) return;
        await supabase.from("user_profiles").delete().eq("id", id);
        showSuccess(locale === "ar" ? "تم حذف المستخدم" : "User deleted");
        fetchUsers();
    };

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const branchPayload = { ...newBranch, shop_id: profile?.shop_id };
            const { error } = await supabase.from("branches").insert(branchPayload);
            if (error) throw error;
            setShowAddBranch(false);
            setNewBranch({ name: "", name_ar: "", phone: "", address: "" });
            showSuccess(locale === "ar" ? "تم إضافة الفرع بنجاح" : "Branch added successfully");
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert(locale === "ar" ? "خطأ: " + err.message : "Error: " + err.message);
        }
        setSaving(false);
    };

    const openEdit = (user: any) => {
        setEditingUserId(user.id);
        setEditUser({ full_name: user.full_name, role: user.role, branch_id: user.branch_id || "", phone: user.phone || "" });
    };

    const roleLabel = (role: string) => {
        const r = ROLES.find(r => r.value === role);
        return locale === "ar" ? (r?.ar || role) : (r?.en || role);
    };

    const roleColor = (role: string) => {
        switch (role) {
            case "admin": return { bg: "rgba(239,68,68,0.15)", color: "#f87171" };
            case "owner": return { bg: "rgba(168,85,247,0.15)", color: "#c084fc" };
            case "branch_manager": return { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" };
            default: return { bg: "rgba(16,185,129,0.15)", color: "#34d399" };
        }
    };

    const sections = [
        { key: "users", icon: Users, label: locale === "ar" ? "إدارة المستخدمين" : "User Management" },
        { key: "shop", icon: Building2, label: locale === "ar" ? "معلومات المتجر" : "Shop Info" },
        { key: "preferences", icon: Globe, label: locale === "ar" ? "التفضيلات" : "Preferences" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Success Toast */}
            {successMsg && (
                <div className="fixed top-20 inset-x-0 z-50 flex justify-center animate-fade-in">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg" style={{ background: "rgba(16,185,129,0.95)", color: "white" }}>
                        <CheckCircle size={18} /> {successMsg}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(216, 128, 48, 0.15)" }}>
                    <Settings size={22} style={{ color: "var(--color-brand-400)" }} />
                </div>
                <h1 className="text-2xl font-bold text-white">{locale === "ar" ? "الإعدادات" : "Settings"}</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full md:w-56 shrink-0 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {sections.map(s => (
                        <button key={s.key} onClick={() => setActiveSection(s.key)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 md:w-full" style={{
                            background: activeSection === s.key ? "linear-gradient(135deg, rgba(216,128,48,0.15), rgba(216,128,48,0.05))" : "transparent",
                            color: activeSection === s.key ? "var(--color-brand-400)" : "var(--color-surface-400)",
                            borderInlineStart: activeSection === s.key ? "3px solid var(--color-brand-500)" : "3px solid transparent",
                        }}>
                            <s.icon size={18} /> {s.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1">
                    {/* ====== Users Section ====== */}
                    {activeSection === "users" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Shield size={20} style={{ color: "var(--color-brand-400)" }} />
                                    {locale === "ar" ? "المستخدمون والصلاحيات" : "Users & Permissions"}
                                </h2>
                                {profile?.role === "admin" && (
                                    <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
                                        <UserPlus size={16} /> {locale === "ar" ? "إضافة مستخدم" : "Add User"}
                                    </button>
                                )}
                            </div>

                            {loadingUsers ? (
                                <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-brand-400)" }} /></div>
                            ) : users.length === 0 ? (
                                <div className="card text-center py-12">
                                    <Users size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--color-surface-400)" }} />
                                    <p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "لا يوجد مستخدمون" : "No users"}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map(user => {
                                        const rc = roleColor(user.role);
                                        const isEditing = editingUserId === user.id;
                                        const isCurrentUser = user.auth_user_id === profile?.auth_user_id;

                                        return (
                                            <div key={user.id} className="card" style={{ padding: "1rem" }}>
                                                {!isEditing ? (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))", color: "white" }}>
                                                                {user.full_name?.charAt(0) || "?"}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-white">{user.full_name}</p>
                                                                    {isCurrentUser && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(216,128,48,0.15)", color: "var(--color-brand-400)" }}>{locale === "ar" ? "أنت" : "You"}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>{roleLabel(user.role)}</span>
                                                                    {user.branches && <span className="text-xs" style={{ color: "var(--color-surface-500)" }}>{locale === "ar" ? user.branches?.name_ar : user.branches?.name}</span>}
                                                                    {user.phone && <span className="text-xs" style={{ color: "var(--color-surface-500)" }}>• {user.phone}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {(profile?.role === "admin" || isCurrentUser) && (
                                                                <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg" style={{ background: "var(--color-surface-700)" }}>
                                                                    <Pencil size={13} style={{ color: "var(--color-brand-400)" }} />
                                                                </button>
                                                            )}
                                                            {profile?.role === "admin" && !isCurrentUser && (
                                                                <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded-lg" style={{ background: "var(--color-surface-700)" }}>
                                                                    <Trash2 size={13} style={{ color: "#f87171" }} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الاسم" : "Name"}</label>
                                                                <input className="input" style={{ fontSize: "0.85rem" }} value={editUser.full_name} onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })} /></div>
                                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الهاتف" : "Phone"}</label>
                                                                <input className="input" dir="ltr" style={{ fontSize: "0.85rem" }} value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} /></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الدور" : "Role"}</label>
                                                                <select className="input" style={{ fontSize: "0.85rem" }} value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}>
                                                                    {ROLES.map(r => (<option key={r.value} value={r.value}>{locale === "ar" ? r.ar : r.en}</option>))}
                                                                </select></div>
                                                            <div><label className="text-xs mb-1 block" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الفرع" : "Branch"}</label>
                                                                <select className="input" style={{ fontSize: "0.85rem" }} value={editUser.branch_id} onChange={(e) => setEditUser({ ...editUser, branch_id: e.target.value })}>
                                                                    <option value="">{locale === "ar" ? "جميع الفروع" : "All Branches"}</option>
                                                                    {branches?.map((b: any) => (<option key={b.id} value={b.id}>{locale === "ar" ? b.name_ar : b.name}</option>))}
                                                                </select></div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={handleUpdateUser} className="btn btn-sm flex-1" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }} disabled={saving}>
                                                                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} {locale === "ar" ? "حفظ" : "Save"}
                                                            </button>
                                                            <button onClick={() => setEditingUserId(null)} className="btn btn-secondary btn-sm"><X size={14} /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add User Modal */}
                            {showAddUser && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowAddUser(false)}>
                                    <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between mb-5">
                                            <h2 className="text-lg font-bold text-white">{locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}</h2>
                                            <button onClick={() => setShowAddUser(false)}><X size={20} style={{ color: "var(--color-surface-400)" }} /></button>
                                        </div>
                                        <form onSubmit={handleAddUser} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="label">{locale === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                                                    <input className="input" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} required /></div>
                                                <div><label className="label">{locale === "ar" ? "الهاتف" : "Phone"}</label>
                                                    <input className="input" dir="ltr" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="label">{locale === "ar" ? "اسم المستخدم" : "Username"}</label>
                                                    <input type="text" dir="ltr" className="input" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required /></div>
                                                <div><label className="label">{locale === "ar" ? "كلمة المرور" : "Password"}</label>
                                                    <input type="password" dir="ltr" className="input" minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="label">{locale === "ar" ? "الدور" : "Role"}</label>
                                                    <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                                        {ROLES.map(r => (<option key={r.value} value={r.value}>{locale === "ar" ? r.ar : r.en}</option>))}
                                                    </select></div>
                                                <div><label className="label">{locale === "ar" ? "الفرع" : "Branch"}</label>
                                                    <select className="input" value={newUser.branch_id} onChange={(e) => setNewUser({ ...newUser, branch_id: e.target.value })}>
                                                        <option value="">{locale === "ar" ? "جميع الفروع" : "All Branches"}</option>
                                                        {branches?.map((b: any) => (<option key={b.id} value={b.id}>{locale === "ar" ? b.name_ar : b.name}</option>))}
                                                    </select></div>
                                                <div className="col-span-2 pt-2 text-xs" style={{ color: "var(--color-surface-400)" }}>
                                                    {locale === "ar" ?
                                                        "سيتم إنشاء حساب جديد للدخول باستخدام البريد الإلكتروني وكلمة المرور أعلاه. يمكنك تغيير الصلاحيات لاحقاً." :
                                                        "A login account will be generated. The user can sign in using the Email and Password provided."}
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                                    {locale === "ar" ? "إضافة وحفظ" : "Add User"}
                                                </button>
                                                <button type="button" onClick={() => setShowAddUser(false)} className="btn btn-secondary">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ====== Shop Info ====== */}
                    {activeSection === "shop" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Building2 size={20} style={{ color: "var(--color-brand-400)" }} />
                                    {locale === "ar" ? "معلومات المتجر والفروع" : "Shop & Branches"}
                                </h2>
                                {(profile?.role === "admin" || profile?.role === "owner") && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddBranch(true)}>
                                        <Plus size={16} /> {locale === "ar" ? "إضافة فرع" : "Add Branch"}
                                    </button>
                                )}
                            </div>
                            {branches && branches.length > 0 ? (
                                <div className="space-y-3">
                                    {branches.map((branch: any) => (
                                        <div key={branch.id} className="card" style={{ padding: "1.25rem" }}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Building2 size={18} style={{ color: "var(--color-brand-400)" }} />
                                                <h3 className="text-base font-semibold text-white">{locale === "ar" ? branch.name_ar : branch.name}</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div><span style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "العنوان" : "Address"}: </span><span className="text-white">{branch.address || "—"}</span></div>
                                                <div><span style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الهاتف" : "Phone"}: </span><span className="text-white">{branch.phone || "—"}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="card text-center py-8"><p className="text-sm" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "لا توجد فروع" : "No branches"}</p></div>
                            )}

                            {/* Add Branch Modal */}
                            {showAddBranch && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowAddBranch(false)}>
                                    <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between mb-5">
                                            <h2 className="text-lg font-bold text-white">{locale === "ar" ? "إضافة فرع جديد" : "Add New Branch"}</h2>
                                            <button onClick={() => setShowAddBranch(false)}><X size={20} style={{ color: "var(--color-surface-400)" }} /></button>
                                        </div>
                                        <form onSubmit={handleAddBranch} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="label">{locale === "ar" ? "اسم الفرع (إنجليزي)" : "Branch Name (En)"}</label>
                                                    <input className="input" dir="ltr" value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} required /></div>
                                                <div><label className="label">{locale === "ar" ? "اسم الفرع (عربي)" : "Branch Name (Ar)"}</label>
                                                    <input className="input" dir="rtl" value={newBranch.name_ar} onChange={(e) => setNewBranch({ ...newBranch, name_ar: e.target.value })} required /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="label">{locale === "ar" ? "الهاتف" : "Phone"}</label>
                                                    <input className="input" dir="ltr" value={newBranch.phone} onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })} required /></div>
                                                <div><label className="label">{locale === "ar" ? "العنوان" : "Address"}</label>
                                                    <input className="input" value={newBranch.address} onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} required /></div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                                    {locale === "ar" ? "إضافة وحفظ" : "Add Branch"}
                                                </button>
                                                <button type="button" onClick={() => setShowAddBranch(false)} className="btn btn-secondary">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ====== Preferences ====== */}
                    {activeSection === "preferences" && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Globe size={20} style={{ color: "var(--color-brand-400)" }} />
                                {locale === "ar" ? "التفضيلات" : "Preferences"}
                            </h2>
                            <div className="card" style={{ padding: "1.25rem" }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-white">{locale === "ar" ? "اللغة" : "Language"}</p>
                                        <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "تبديل لغة النظام" : "Switch system language"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href="/ar/settings" className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{
                                            background: locale === "ar" ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "var(--color-surface-800)",
                                            color: locale === "ar" ? "white" : "var(--color-surface-400)", textDecoration: "none",
                                        }}>العربية</a>
                                        <a href="/en/settings" className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{
                                            background: locale === "en" ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" : "var(--color-surface-800)",
                                            color: locale === "en" ? "white" : "var(--color-surface-400)", textDecoration: "none",
                                        }}>English</a>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white">{locale === "ar" ? "العملة" : "Currency"}</p>
                                        <p className="text-xs" style={{ color: "var(--color-surface-400)" }}>{locale === "ar" ? "الريال العماني (ر.ع.)" : "Omani Rial (OMR)"}</p>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: "var(--color-brand-400)" }}>OMR</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
