"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/database";

// Master Admin fallback ID
const MASTER_ADMIN_EMAIL = "abdulmajeedalbarhi@gmail.com";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setIsLoading(false);
        };

        getSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async (authUserId: string) => {
        const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("auth_user_id", authUserId)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Error fetching profile:", error);
        }

        setProfile(data || null);
        return data;
    };

    const signIn = async (email: string, password: string) => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // Auto-recovery for the master admin if their profile row was deleted
        if (!error && authData?.user && email.toLowerCase() === MASTER_ADMIN_EMAIL) {
            const profile = await fetchProfile(authData.user.id);
            if (!profile) {
                console.log("Master Admin missing profile row. Auto-healing...");
                await supabase.from("user_profiles").insert({
                    auth_user_id: authData.user.id,
                    full_name: "Abdulmajeed",
                    email: MASTER_ADMIN_EMAIL,
                    role: "admin",
                });
                await fetchProfile(authData.user.id); // Reload the healed profile
            }
        }

        return { error: error?.message ?? null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
