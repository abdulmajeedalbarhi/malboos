import type { UserRole } from "@/types/database";

// ============================================================
// Clothing Categories
// ============================================================
export const CATEGORIES = [
    { key: "bisht", en: "Bisht", ar: "بشت" },
    { key: "shaal", en: "Shaal", ar: "شال" },
    { key: "massar", en: "Massar", ar: "مصر" },
    { key: "khanjar", en: "Khanjar", ar: "خنجر" },
    { key: "saif", en: "Saif", ar: "سيف" },
    { key: "kummah", en: "Kummah", ar: "كمة" },
] as const;

// ============================================================
// Role Hierarchy (higher number = more access)
// ============================================================
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    cashier: 1,
    branch_manager: 2,
    owner: 3,
    admin: 4,
};

// ============================================================
// Navigation Items (role-filtered in sidebar)
// ============================================================
export interface NavItem {
    key: string;
    href: string;
    icon: string;
    minRole: UserRole;
}

export const NAV_ITEMS: NavItem[] = [
    { key: "dashboard", href: "/dashboard", icon: "LayoutDashboard", minRole: "cashier" },
    { key: "pos", href: "/pos", icon: "ShoppingCart", minRole: "cashier" },
    { key: "transactions", href: "/transactions", icon: "Receipt", minRole: "cashier" },
    { key: "inventory", href: "/inventory", icon: "Package", minRole: "cashier" },
    { key: "rentals", href: "/rentals", icon: "CalendarClock", minRole: "cashier" },
    { key: "customers", href: "/customers", icon: "Users", minRole: "cashier" },
    { key: "financial", href: "/financial", icon: "Landmark", minRole: "branch_manager" },
    { key: "reports", href: "/reports", icon: "BarChart3", minRole: "owner" },
    { key: "settings", href: "/settings", icon: "Settings", minRole: "owner" },
];

// ============================================================
// Financial Period
// ============================================================
export const PERIOD_TYPES = ["weekly", "monthly"] as const;
export const PERIOD_STATUSES = ["open", "pending_approval", "approved", "closed", "reopened"] as const;

// ============================================================
// Rental Statuses
// ============================================================
export const RENTAL_STATUSES = ["booked", "active", "overdue", "returned", "completed", "cancelled"] as const;

// ============================================================
// Payment Methods
// ============================================================
export const PAYMENT_METHODS = ["cash", "card", "transfer"] as const;
