'use client';

import { usePathname } from '@/navigation';
import { Menu, LogOut } from 'lucide-react';
import UserProfile from './UserProfile';
import NotificationsDropdown from './NotificationsDropdown';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import Logo from '@/components/ui/logo';

const Topbar = () => {
    const pathname = usePathname();
    const t = useTranslations('page_titles');
    
    // Map paths to translation keys
    const getPageTitleKey = (path: string) => {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
        
        if (cleanPath === '/dashboard' || cleanPath === '') return 'dashboard';
        if (cleanPath === '/sales/customers') return 'customers';
        if (cleanPath === '/sales/orders') return 'sales_orders';
        if (cleanPath === '/purchases/suppliers') return 'suppliers';
        if (cleanPath === '/purchases/orders') return 'purchase_orders';
        if (cleanPath === '/purchases/receptions') return 'receptions';
        if (cleanPath === '/catalogue/products' || cleanPath === '/products') return 'products';
        if (cleanPath === '/product-families') return 'families';
        if (cleanPath === '/inventory') return 'inventory';
        if (cleanPath === '/manufacturing/orders') return 'manufacturing';
        if (cleanPath === '/invoices') return 'invoices';
        if (cleanPath === '/treasury/aged-receivables') return 'aged_receivables';
        if (cleanPath === '/treasury/forecast') return 'forecast';
        if (cleanPath === '/expenses') return 'expenses';
        if (cleanPath === '/analytics') return 'analytics';
        if (cleanPath === '/analytics/abc') return 'abc';
        if (cleanPath === '/analytics/dead-stock') return 'dead_stock';
        if (cleanPath === '/hr/employees') return 'employees';
        if (cleanPath === '/hr/leaves') return 'leaves';
        if (cleanPath === '/hr/payroll') return 'payroll';
        if (cleanPath === '/hr/recruitment') return 'recruitment';
        if (cleanPath === '/hr/performance') return 'performance';
        if (cleanPath.startsWith('/settings')) return 'settings';
        if (cleanPath.startsWith('/collaboration')) return 'collaboration';
        
        return 'ai';
    };
    
    const pageTitleKey = getPageTitleKey(pathname);
    const pageTitle = t(pageTitleKey);

    return (
        <header className="bg-white border-b border-slate-100 h-16 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all shadow-sm">
            {/* Left Section: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
                <button className="md:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500">
                    <Menu size={20} />
                </button>
                <Logo variant="full" width={140} height={38} />
            </div>

            {/* Center Section: Page Title */}
            <div className="flex-1 flex justify-center px-4">
                <h1 className="text-base font-extrabold text-slate-800 tracking-tight text-center truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                    {pageTitle}
                </h1>
            </div>

            {/* Right Section: Notifications, User Profile & Direct Logout */}
            <div className="flex items-center gap-2">
                <NotificationsDropdown />
                
                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
                
                <UserProfile />
                
                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                <button 
                    onClick={async () => {
                        localStorage.removeItem('atlas_token');
                        document.cookie = 'atlas_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                        await signOut({ callbackUrl: '/fr/login' });
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Se déconnecter"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
