import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During build/prerender, env vars may not be set
    if (!supabaseUrl || !supabaseAnonKey) {
        return createBrowserClient(
            "https://placeholder.supabase.co",
            "placeholder-key"
        );
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
