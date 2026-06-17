'use client';

import { useState, useEffect } from 'react';
import { usePathname } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations('page_titles');
  const locale = useLocale();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleLogout = async () => {
    localStorage.removeItem('atlas_token');
    document.cookie = 'atlas_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await signOut({ callbackUrl: `/${locale}/login` });
  };

  const fullName = user?.employee 
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email.split('@')[0] || 'Utilisateur';

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleName = user?.role
    ? user.role.replace(/_/g, ' ').toUpperCase()
    : 'COLLABORATEUR';

  return (
    <header className="w-full h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-50">
      
      {/* LEFT SIDE: Level Segment Subtitle */}
      <div className="flex items-center h-full">
        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 tracking-wide">
          {pageTitle}
        </span>
      </div>

      {/* RIGHT SIDE: Action Buttons & User Badge locked on the exact same line */}
      <div className="flex items-center space-x-5 h-full">
        
        {/* Notification Alert Trigger */}
        <NotificationsDropdown />

        <div className="h-5 w-[1px] bg-gray-200" />

        {/* User Module Status Card */}
        {mounted && user ? (
          <div className="flex items-center space-x-2.5 h-full">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
            <div className="flex flex-col text-left justify-center">
              <span className="text-xs font-semibold text-slate-800 leading-none mb-0.5">{fullName}</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">{roleName}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2.5 h-full opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse flex items-center justify-center font-bold text-xs" />
            <div className="flex flex-col text-left justify-center space-y-1">
              <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
              <div className="w-12 h-2 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors focus:outline-none flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
}
