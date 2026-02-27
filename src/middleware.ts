import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Public paths that don't require authentication
const publicPaths = ["/login", "/forgot-password"];

function isPublicPath(pathname: string): boolean {
    // Remove locale prefix to check path
    const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";
    return publicPaths.some((p) => pathWithoutLocale.startsWith(p));
}

export async function middleware(request: NextRequest) {
    // 1. Run Supabase session refresh
    const { user, supabaseResponse } = await updateSession(request);

    const pathname = request.nextUrl.pathname;

    // 2. Check if user is accessing a protected route without auth
    if (!user && !isPublicPath(pathname)) {
        const locale = pathname.startsWith("/en") ? "en" : "ar";
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Redirect logged-in users away from login page
    if (user && isPublicPath(pathname)) {
        const locale = pathname.startsWith("/en") ? "en" : "ar";
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    // 4. Run i18n middleware for locale detection/redirect
    const intlResponse = intlMiddleware(request);

    // Merge cookies from Supabase response into intl response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
    });

    return intlResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public files (images, manifest, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
