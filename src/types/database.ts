// ============================================================
// Database Type Definitions for Supabase
// ============================================================
// These types mirror the PostgreSQL schema. In production,
// generate these automatically with:
//   npx supabase gen types typescript --project-id <id>
// ============================================================

export type UserRole = "admin" | "owner" | "branch_manager" | "cashier";
export type ItemType = "sale" | "rental" | "both";
export type ItemStatus = "available" | "rented" | "sold" | "reserved" | "damaged";
export type TransactionType = "sale" | "rental_payment" | "rental_deposit" | "refund";
export type PaymentMethod = "cash" | "card" | "transfer";
export type RentalStatus = "booked" | "active" | "overdue" | "returned" | "completed" | "cancelled";
export type PeriodType = "weekly" | "monthly";
export type PeriodStatus = "open" | "pending_approval" | "approved" | "closed" | "reopened";

export interface Database {
    public: {
        Tables: {
            shops: {
                Row: {
                    id: string;
                    name: string;
                    name_ar: string;
                    owner_user_id: string | null;
                    settings: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["shops"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["shops"]["Insert"]>;
            };
            branches: {
                Row: {
                    id: string;
                    shop_id: string;
                    name: string;
                    name_ar: string;
                    address: string | null;
                    phone: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
            };
            user_profiles: {
                Row: {
                    id: string;
                    auth_user_id: string;
                    full_name: string;
                    email: string;
                    phone: string | null;
                    role: UserRole;
                    shop_id: string | null;
                    branch_id: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["user_profiles"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
            };
            categories: {
                Row: {
                    id: string;
                    name: string;
                    name_ar: string;
                    description: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id">;
                Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
            };
            inventory_items: {
                Row: {
                    id: string;
                    branch_id: string;
                    category_id: string;
                    sku: string;
                    name: string;
                    name_ar: string;
                    description: string | null;
                    item_type: ItemType;
                    purchase_price: number;
                    sale_price: number;
                    rental_price_daily: number;
                    deposit_amount: number;
                    quantity: number;
                    attributes: Record<string, unknown> | null;
                    image_urls: string[];
                    status: ItemStatus;
                    is_high_value: boolean;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["inventory_items"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
            };
            customers: {
                Row: {
                    id: string;
                    full_name: string;
                    phone: string;
                    id_number: string | null;
                    id_image_url: string | null;
                    address: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
            };
            transactions: {
                Row: {
                    id: string;
                    branch_id: string;
                    cashier_id: string;
                    customer_id: string | null;
                    financial_period_id: string | null;
                    type: TransactionType;
                    total_amount: number;
                    discount: number;
                    final_amount: number;
                    payment_method: PaymentMethod;
                    notes: string | null;
                    is_locked: boolean;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
            };
            transaction_items: {
                Row: {
                    id: string;
                    transaction_id: string;
                    inventory_item_id: string;
                    quantity: number;
                    unit_price: number;
                    subtotal: number;
                };
                Insert: Omit<Database["public"]["Tables"]["transaction_items"]["Row"], "id">;
                Update: Partial<Database["public"]["Tables"]["transaction_items"]["Insert"]>;
            };
            rentals: {
                Row: {
                    id: string;
                    branch_id: string;
                    customer_id: string;
                    inventory_item_id: string;
                    cashier_id: string;
                    start_date: string;
                    due_date: string;
                    returned_date: string | null;
                    status: RentalStatus;
                    deposit_paid: number;
                    rental_fee: number;
                    overdue_fee: number;
                    notes: string | null;
                    reminder_sent: boolean;
                    is_locked: boolean;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["rentals"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["rentals"]["Insert"]>;
            };
            financial_periods: {
                Row: {
                    id: string;
                    branch_id: string;
                    period_type: PeriodType;
                    start_date: string;
                    end_date: string;
                    status: PeriodStatus;
                    submitted_by: string | null;
                    approved_by: string | null;
                    total_sales: number;
                    total_rentals: number;
                    total_refunds: number;
                    comments: string | null;
                    submitted_at: string | null;
                    approved_at: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["financial_periods"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["financial_periods"]["Insert"]>;
            };
        };
    };
}

// Convenience type aliases
export type Shop = Database["public"]["Tables"]["shops"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionItem = Database["public"]["Tables"]["transaction_items"]["Row"];
export type Rental = Database["public"]["Tables"]["rentals"]["Row"];
export type FinancialPeriod = Database["public"]["Tables"]["financial_periods"]["Row"];
