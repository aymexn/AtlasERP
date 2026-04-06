import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import AuthWrapper from '@/components/AuthWrapper';
import { getLocale } from 'next-intl/server';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
    const isRtl = locale === 'ar';

    return (
        <AuthWrapper>
            <div className={`flex min-h-screen bg-gray-50/50 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Fixed Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <Topbar />
                    <main className="flex-1 p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </main>

                    {/* Modern Footer (Simple) */}
                    <footer className="p-8 border-t border-gray-100 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                        <span>© 2026 Atlas Intelligence ERP</span>
                        <div className="flex gap-6">
                            <span className="hover:text-blue-600 cursor-pointer transition-colors">Documentation</span>
                            <span className="hover:text-blue-600 cursor-pointer transition-colors">Support</span>
                        </div>
                    </footer>
                </div>
            </div>
        </AuthWrapper>
    );
}
