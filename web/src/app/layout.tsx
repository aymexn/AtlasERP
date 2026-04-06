import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AtlasERP | Enterprise Management",
    description: "Premium Multi-tenant SaaS Cloud ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // We don't set lang here because it's set in the [locale] layout
    // This allows next-intl to control the html tag direction and lang.
    return (
        <html suppressHydrationWarning>
            <body className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}