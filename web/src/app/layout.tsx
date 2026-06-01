import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { HydrationGuard } from "@/components/ui/hydration-guard";
import { getLocale } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AtlasERP | Enterprise Management",
    description: "Premium Multi-tenant SaaS Cloud ERP",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const locale = await getLocale();
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction} suppressHydrationWarning={true}>
            <body className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`} suppressHydrationWarning={true}>
                <HydrationGuard />
                {children}
            </body>
        </html>
    );
}
