'use client';

import { Link, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    TrendingUp,
    Receipt,
    Settings,
    FolderTree,
    Factory,
    ShoppingCart,
    Users,
    Truck,
    Building2,
    Wallet,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
    const t = useTranslations('nav');
    const ct = useTranslations('common');
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const groups = [
        {
            title: t('groups.catalogue'),
            items: [
                { name: t('items.products'), href: '/products', icon: Package, disabled: false },
                { name: t('items.families'), href: '/product-families', icon: FolderTree, disabled: false },
            ]
        },
        {
            title: t('groups.production'),
            items: [
                { name: t('items.inventory'), href: '/inventory', icon: ClipboardList, disabled: false },
                { name: t('items.manufacturing'), href: '/manufacturing/orders', icon: Factory, disabled: false },
            ]
        },
        {
            title: t('groups.commerce'),
            items: [
                { name: t('items.customers'), href: '/sales/customers', icon: Users, disabled: false },
                { name: t('items.sales'), href: '/sales/orders', icon: TrendingUp, disabled: false },
                { name: t('items.suppliers'), href: '/purchases/suppliers', icon: Building2, disabled: false },
                { name: t('items.purchase_orders'), href: '/purchases/orders', icon: ShoppingCart, disabled: false },
                { name: t('items.receptions'), href: '/purchases/receptions', icon: Truck, disabled: false },
            ]
        },
        {
            title: t('groups.finance'),
            items: [
                { name: t('items.invoices'), href: '/invoices', icon: Receipt, disabled: false },
                { name: t('items.expenses'), href: '/expenses', icon: Wallet, disabled: false },
            ]
        }
    ];

    return (
        <aside
            className={`
                bg-white border-r border-slate-100 shadow-xl transition-all duration-300 z-50 sticky top-0 h-screen flex flex-col shrink-0
                ${collapsed ? 'w-[60px]' : 'w-[280px]'}
            `}
        >
            {/* Header / Brand - Restored to Elite Compact Standard (56px) */}
            <div className={`h-14 flex items-center border-b border-slate-50 shrink-0 transition-all ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
                <div className="h-10 w-10 shrink-0 bg-blue-600 rounded-[10px] flex items-center justify-center font-bold text-[18px] text-white shadow-sm">
                    A
                </div>
                {!collapsed && (
                    <div className="ml-3 flex items-center animate-in fade-in slide-in-from-left-2 duration-500">
                        <span className="text-[18px] font-bold tracking-tight">
                            <span className="text-slate-800">Atlas</span>
                            <span className="text-blue-600">ERP</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-8 space-y-10">
                {/* Dashboard Link */}
                <div className={`flex flex-col items-center gap-4 ${collapsed ? 'px-0' : 'px-2'}`}>
                    <Link
                        href="/dashboard"
                        className={`
                            flex items-center rounded-xl transition-all group h-12
                            ${collapsed ? 'w-10 justify-center' : 'w-full px-4 gap-4'}
                            ${pathname === '/dashboard'
                                ? 'bg-blue-50 text-primary font-bold shadow-sm'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-primary'
                            }
                        `}
                    >
                        <LayoutDashboard size={20} className="shrink-0" />
                        {!collapsed && <span className="text-[14px] font-bold tracking-tight whitespace-nowrap rtl:font-black">{t('dashboard')}</span>}
                    </Link>
                </div>

                {groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-3">
                        {!collapsed && (
                            <h3 className="px-7 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap rtl:text-slate-400">
                                {group.title}
                            </h3>
                        )}
                        <div className={`flex flex-col items-center gap-1 ${collapsed ? 'px-0' : 'px-2'}`}>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                if (item.disabled) return null;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href as any}
                                        className={`
                                            flex items-center rounded-xl transition-all h-12
                                            ${collapsed ? 'w-10 justify-center' : 'w-full px-4 gap-4'}
                                            ${isActive
                                                ? 'bg-blue-50 text-primary font-bold shadow-sm'
                                                : 'text-slate-400 hover:bg-slate-50 hover:text-primary'
                                            }
                                        `}
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        {!collapsed && <span className="text-[14px] font-bold tracking-tight whitespace-nowrap rtl:font-black">{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / Toggle & Settings */}
            <div className={`p-2 border-t border-slate-50 flex flex-col items-center transition-all bg-slate-50/30 ${collapsed ? 'gap-2' : 'gap-3'}`}>
                <Link
                    href="/settings"
                    className={`
                        flex items-center rounded-xl transition-all h-12
                        ${collapsed ? 'w-10 justify-center' : 'w-full px-4 gap-4'}
                        ${pathname === '/settings'
                            ? 'bg-blue-50 text-primary font-bold shadow-sm'
                            : 'text-slate-400 hover:bg-slate-50 hover:text-primary'
                        }
                    `}
                >
                    <Settings size={20} className="shrink-0" />
                    {!collapsed && <span className="text-[14px] font-bold tracking-tight whitespace-nowrap">{t('items.settings')}</span>}
                </Link>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`
                        flex items-center rounded-xl transition-all h-12 group
                        ${collapsed ? 'w-10 justify-center' : 'w-full px-4 gap-4'}
                        text-slate-300 hover:bg-slate-100/50 hover:text-slate-600 font-bold
                    `}
                >
                    {collapsed ? (
                        <ChevronRight size={20} className="transition-transform" />
                    ) : (
                        <>
                            <ChevronLeft size={20} className="shrink-0 group-hover:-translate-x-0.5 transition-transform" /> 
                            <span className="text-[10px] uppercase font-black tracking-widest whitespace-nowrap opacity-60">
                                RÉDUIRE
                            </span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
