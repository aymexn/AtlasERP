import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AuthWrapper from '@/components/AuthWrapper';
import ShortcutProvider from '@/components/ShortcutProvider';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { getLocale } from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
    const isRtl = locale === 'ar';

    return (
        <AuthProvider>
            <AuthWrapper>
                <PermissionProvider>
                    <ShortcutProvider>
                        <div className="flex min-h-screen bg-gray-50/50 flex-row" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
                            {/* Fixed Sidebar */}
                            <Sidebar />

                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <Navbar />
                                <main className="flex-1 p-8 overflow-y-auto">
                                    <div className="max-w-7xl mx-auto w-full">
                                        {children}
                                    </div>
                                </main>

                                {/* Modern Footer (Simple) */}
                                <footer className="p-8 border-t border-gray-100 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    <span>© 2026 Atlas Intelligence ERP — Version 2.0</span>
                                    <div className="flex gap-6">
                                        <a href="/settings" className="hover:text-blue-600 transition-colors">Documentation</a>
                                        <a href="mailto:support@atlaserp.com" className="hover:text-blue-600 transition-colors">Support</a>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </ShortcutProvider>
                </PermissionProvider>
            </AuthWrapper>
        </AuthProvider>
    );
}
