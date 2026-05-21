import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { HydrationGuard } from "@/components/ui/hydration-guard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AtlasERP | Enterprise Management",
    description: "Premium Multi-tenant SaaS Cloud ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // We don't set lang here because it's set in the [locale] layout
    // This allows next-intl to control the html tag direction and lang.
    return (
        <html suppressHydrationWarning={true}>
            <body className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`} suppressHydrationWarning={true}>
                <HydrationGuard />
                {children}
            </body>
        </html>
    );
}
