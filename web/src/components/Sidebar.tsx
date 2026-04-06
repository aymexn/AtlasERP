'use client';

import { Link, usePathname } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    TrendingUp,
    Receipt,
    Settings,
    ChevronLeft,
    ChevronRight,
    FolderTree,
    Factory,
    ShoppingCart,
    User,
    Truck
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard, disabled: false },
        { name: t('products'), href: '/products', icon: Package, disabled: false },
        { name: t('product_families'), href: '/product-families', icon: FolderTree, disabled: false },
        { name: t('inventory'), href: '/inventory', icon: ClipboardList, disabled: false },
        { name: t('manufacturing'), href: '/manufacturing/orders', icon: Factory, disabled: false },
        
        // Purchasing Group
        { name: 'Fournisseurs', href: '/purchases/suppliers', icon: User, disabled: false },
        { name: 'Bons de Commande', href: '/purchases/orders', icon: ShoppingCart, disabled: false },
        { name: 'Réceptions Stock', href: '/purchases/receptions', icon: Truck, disabled: false },

        { name: t('customers'), href: '/sales/customers', icon: User, disabled: false },
        { name: t('sales'), href: '/sales/orders', icon: TrendingUp, disabled: false },
        { name: t('invoices'), href: '/sales/invoices', icon: Receipt, disabled: false },
        { name: t('expenses'), href: '/finances/expenses', icon: Receipt, disabled: false },
        { name: t('settings'), href: '/settings', icon: Settings, disabled: true },
    ];

    return (
        <aside
            className={`
                bg-white border-gray-200 shadow-xl transition-all duration-300 z-30 sticky top-0 h-screen
                ${collapsed ? 'w-20' : 'w-72'}
                ${isRtl ? 'border-l' : 'border-r'}
            `}
        >
            <div className="flex flex-col h-full">
                {/* Brand Logo Section */}
                <div className="p-6 flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">A</div>
                            <span className="text-xl font-black text-gray-900 tracking-tighter italic">Atlas<span className="text-blue-600">ERP</span></span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="mx-auto h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">A</div>
                    )}
                </div>

                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`
                        absolute top-16 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 transition-all
                        ${isRtl ? '-left-3 rotate-0' : '-right-3 rotate-0'}
                    `}
                >
                    {collapsed ? (isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : (isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
                </button>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 mt-6 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.disabled ? '#' : item.href as any}
                                className={`
                                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : item.disabled
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                    }
                                `}
                                onClick={(e) => item.disabled && e.preventDefault()}
                            >
                                <Icon size={20} className={`${isActive ? 'text-white' : 'group-hover:text-blue-600'}`} />
                                {!collapsed && (
                                    <div className="flex flex-1 items-center justify-between">
                                        <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                        {item.disabled && (
                                            <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md group-hover:bg-blue-100 group-hover:text-blue-400">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-6 border-t border-gray-100">
                    {!collapsed && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-gray-700">Cloud Sync Active</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
