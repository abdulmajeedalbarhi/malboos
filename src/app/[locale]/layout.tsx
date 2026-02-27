import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localeDirection } from "@/i18n/config";
import { Providers } from "@/components/Providers";
import "../globals.css";

export const metadata: Metadata = {
    title: "Malboos — ملبوس",
    description:
        "Omani Traditional Clothing Management, POS & Rental System — نظام إدارة الملابس العمانية التقليدية",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Malboos",
    },
};

export const viewport: Viewport = {
    themeColor: "#d88030",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Validate locale
    if (!routing.locales.includes(locale as "ar" | "en")) {
        notFound();
    }

    setRequestLocale(locale);

    const messages = await getMessages();
    const dir = localeDirection[locale as "ar" | "en"];

    return (
        <html lang={locale} dir={dir} suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Kufi+Arabic:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <NextIntlClientProvider messages={messages}>
                    <Providers>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
