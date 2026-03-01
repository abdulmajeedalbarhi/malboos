"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================
// Categories
// ============================================================
export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("name");
            if (error) throw error;
            return data as any[];
        },
    });
}

// ============================================================
// Branches
// ============================================================
export function useBranches() {
    return useQuery({
        queryKey: ["branches"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("branches")
                .select("*")
                .order("name");
            if (error) throw error;
            return data as any[];
        },
    });
}

// ============================================================
// Inventory
// ============================================================
export function useInventory(branchId?: string) {
    return useQuery({
        queryKey: ["inventory", branchId],
        queryFn: async () => {
            let query = supabase
                .from("inventory_items")
                .select("*, categories(name, name_ar)")
                .order("created_at", { ascending: false });
            if (branchId) query = query.eq("branch_id", branchId);
            const { data, error } = await query;
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useAddInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: any) => {
            const { data, error } = await supabase
                .from("inventory_items")
                .insert(item)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    });
}

export function useUpdateInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string;[key: string]: any }) => {
            const { data, error } = await supabase
                .from("inventory_items")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    });
}

export function useDeleteInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("inventory_items").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    });
}

// ============================================================
// Customers
// ============================================================
export function useCustomers() {
    return useQuery({
        queryKey: ["customers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useAddCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customer: any) => {
            const { data, error } = await supabase
                .from("customers")
                .insert(customer)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string;[key: string]: any }) => {
            const { data, error } = await supabase
                .from("customers")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    });
}

// ============================================================
// Transactions
// ============================================================
export function useTransactions(branchId?: string, limit?: number) {
    return useQuery({
        queryKey: ["transactions", branchId, limit],
        queryFn: async () => {
            let query = supabase
                .from("transactions")
                .select("*, customers(full_name, phone)")
                .order("created_at", { ascending: false });
            if (branchId) query = query.eq("branch_id", branchId);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            transaction: any;
            items: { inventory_item_id: string; quantity: number; unit_price: number; subtotal: number }[];
        }) => {
            // Insert transaction
            const { data: tx, error: txError } = await supabase
                .from("transactions")
                .insert(payload.transaction)
                .select()
                .single();
            if (txError) throw txError;

            // Insert line items
            const lineItems = payload.items.map((item) => ({
                ...item,
                transaction_id: (tx as any).id,
            }));
            const { error: itemError } = await supabase
                .from("transaction_items")
                .insert(lineItems);
            if (itemError) throw itemError;

            // Update inventory quantities (decrease stock)
            for (const item of payload.items) {
                const { data: invItem } = await supabase
                    .from("inventory_items")
                    .select("quantity")
                    .eq("id", item.inventory_item_id)
                    .single();
                if (invItem) {
                    await supabase
                        .from("inventory_items")
                        .update({ quantity: Math.max(0, (invItem as any).quantity - item.quantity) })
                        .eq("id", item.inventory_item_id);
                }
            }

            return tx;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("transactions").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            // By deleting the transaction, if the database cascade deletes 
            // the transaction_items, the inventory quantities won't technically roll back 
            // automatically unless there's a trigger. But for now this removes the ledger entry.
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string;[key: string]: any }) => {
            const { data, error } = await supabase
                .from("transactions")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["reports"] });
        },
    });
}

// ============================================================
// Rentals
// ============================================================
export function useRentals(branchId?: string, status?: string) {
    return useQuery({
        queryKey: ["rentals", branchId, status],
        queryFn: async () => {
            let query = supabase
                .from("rentals")
                .select("*, customers(full_name, phone), inventory_items(name, name_ar, sku)")
                .order("created_at", { ascending: false });
            if (branchId) query = query.eq("branch_id", branchId);
            if (status && status !== "all") query = query.eq("status", status);
            const { data, error } = await query;
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useCreateRental() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (rental: any) => {
            const { data, error } = await supabase
                .from("rentals")
                .insert(rental)
                .select()
                .single();
            if (error) throw error;

            // Update inventory status to rented
            await supabase
                .from("inventory_items")
                .update({ status: "rented" })
                .eq("id", rental.inventory_item_id);

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
}

export function useUpdateRental() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string;[key: string]: any }) => {
            const { data, error } = await supabase
                .from("rentals")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;

            // If returned/completed, update inventory status back to available
            if (updates.status === "returned" || updates.status === "completed") {
                const rental = await supabase.from("rentals").select("inventory_item_id").eq("id", id).single();
                if (rental.data) {
                    await supabase
                        .from("inventory_items")
                        .update({ status: "available" })
                        .eq("id", (rental.data as any).inventory_item_id);
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
}

// ============================================================
// Financial Periods
// ============================================================
export function useFinancialPeriods(branchId?: string, periodType?: string) {
    return useQuery({
        queryKey: ["financial_periods", branchId, periodType],
        queryFn: async () => {
            let query = supabase
                .from("financial_periods")
                .select("*")
                .order("start_date", { ascending: false });
            if (branchId) query = query.eq("branch_id", branchId);
            if (periodType) query = query.eq("period_type", periodType);
            const { data, error } = await query;
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useCreateFinancialPeriod() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (period: any) => {
            const { data, error } = await supabase
                .from("financial_periods")
                .insert(period)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financial_periods"] }),
    });
}

export function useUpdateFinancialPeriod() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string;[key: string]: any }) => {
            const { data, error } = await supabase
                .from("financial_periods")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financial_periods"] }),
    });
}

// ============================================================
// Dashboard Stats
// ============================================================
export function useDashboardStats(branchId?: string) {
    return useQuery({
        queryKey: ["dashboard", branchId],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Prepare all queries
            // Count all transaction types except refunds for sales? Or all positive transactions.
            // Let's count all transactions for "Total Sales"
            let salesQuery = supabase.from("transactions").select("final_amount").eq("type", "sale");
            if (branchId) salesQuery = salesQuery.eq("branch_id", branchId);

            let rentalsQuery = supabase.from("rentals").select("id", { count: "exact", head: true }).eq("status", "active");
            if (branchId) rentalsQuery = rentalsQuery.eq("branch_id", branchId);

            let overdueQuery = supabase.from("rentals").select("id", { count: "exact", head: true }).eq("status", "overdue");
            if (branchId) overdueQuery = overdueQuery.eq("branch_id", branchId);

            let revenueQuery = supabase.from("transactions").select("final_amount");
            if (branchId) revenueQuery = revenueQuery.eq("branch_id", branchId);

            let invQuery = supabase.from("inventory_items").select("category_id, categories(name, name_ar)");
            if (branchId) invQuery = invQuery.eq("branch_id", branchId);

            // Execute all queries concurrently
            const [
                { data: salesData },
                { count: activeRentals },
                { count: overdueRentals },
                { data: revenueData },
                { data: invData }
            ] = await Promise.all([
                salesQuery,
                rentalsQuery,
                overdueQuery,
                revenueQuery,
                invQuery
            ]);

            const totalSales = (salesData as any[])?.reduce((sum: number, t: any) => sum + (t.final_amount || 0), 0) || 0;
            const totalRevenue = (revenueData as any[])?.reduce((sum: number, t: any) => sum + (t.final_amount || 0), 0) || 0;

            const inventorySummary: Record<string, { name: string; name_ar: string; count: number }> = {};
            (invData as any[])?.forEach((item: any) => {
                const catId = item.category_id;
                const cat = Array.isArray(item.categories) ? item.categories[0] : item.categories;
                if (!inventorySummary[catId]) {
                    inventorySummary[catId] = {
                        name: cat?.name || "",
                        name_ar: cat?.name_ar || "",
                        count: 0,
                    };
                }
                inventorySummary[catId].count++;
            });

            return {
                totalSales,
                activeRentals: activeRentals || 0,
                overdueRentals: overdueRentals || 0,
                totalRevenue,
                inventorySummary: Object.values(inventorySummary),
            };
        },
    });
}
