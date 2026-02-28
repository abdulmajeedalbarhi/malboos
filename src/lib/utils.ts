import { type UserRole } from "@/types/database";
import { ROLE_HIERARCHY } from "./constants";

/**
 * Check if a user role has at least the required minimum role level.
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Format currency for Omani Rial (OMR).
 */
export function formatCurrency(amount: number, locale: string = "ar-OM"): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "OMR",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(amount);
}

/**
 * Format a date string for display.
 */
export function formatDate(date: string | Date, locale: string = "ar-OM"): string {
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
}

/**
 * Format a date + time string for display.
 */
export function formatDateTime(date: string | Date, locale: string = "ar-OM"): string {
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

/**
 * Generate a readable SKU from category and index.
 */
export function generateSku(categoryKey: string, index: number): string {
    const prefix = categoryKey.substring(0, 3).toUpperCase();
    return `${prefix}-${String(index).padStart(5, "0")}`;
}

/**
 * Calculate overdue days from a due date.
 */
export function calculateOverdueDays(dueDate: string | Date): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = now.getTime() - due.getTime();
    return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

/**
 * Merge class names, filtering falsy values.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}
