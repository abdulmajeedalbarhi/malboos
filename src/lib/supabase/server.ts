import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During build/prerender, env vars may not be set
    if (!supabaseUrl || !supabaseAnonKey) {
        return createServerClient<Database>(
            "https://placeholder.supabase.co",
            "placeholder-key",
            {
                cookies: {
                    getAll() { return []; },
                    setAll() { },
                },
            }
        );
    }

    const cookieStore = await cookies();

    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing sessions.
                }
            },
        },
    });
}
