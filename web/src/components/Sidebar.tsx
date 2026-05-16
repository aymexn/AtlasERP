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
    ChevronRight,
    Shield,
    History,
    LineChart,
    AlertCircle,
    UserPlus,
    UserCog,
    PieChart,
    Calendar
} from 'lucide-react';
import { useState } from 'react';
import { Can } from '@/components/guards/PermissionGuard';
import { usePermissions } from '@/contexts/PermissionContext';

const Sidebar = () => {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'commerce']);
    const { hasPermission } = usePermissions();

    const toggleSection = (id: string) => {
        setExpandedSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const menuStructure = [
        {
            id: 'dashboard',
            title: t('groups.dashboard'),
            icon: LayoutDashboard,
            items: [
                { name: t('items.dashboard_overview'), href: '/dashboard', icon: LayoutDashboard },
            ]
        },
        {
            id: 'administration',
            title: t('groups.administration'),
            icon: Shield,
            items: [
                { name: t('items.users_roles'), href: '/settings/users', icon: Users, permission: { module: 'users', resource: 'user', action: 'read' } },
                { name: t('items.permissions'), href: '/settings/roles', icon: Shield, permission: { module: 'roles', resource: 'role', action: 'read' } },
                { name: t('items.activity_log'), href: '/settings/audit', icon: History, permission: { module: 'audit', resource: 'log', action: 'read' } },
                { name: t('items.settings'), href: '/settings', icon: Settings },
            ]
        },
        {
            id: 'commerce',
            title: t('groups.commerce'),
            icon: ShoppingCart,
            items: [
                { name: t('items.customers'), href: '/sales/customers', icon: Users },
                { name: t('items.sales'), href: '/sales/orders', icon: TrendingUp },
                { name: t('items.suppliers'), href: '/purchases/suppliers', icon: Building2 },
                { name: t('items.purchase_orders'), href: '/purchases/orders', icon: ShoppingCart },
                { name: t('items.receptions'), href: '/purchases/receptions', icon: Truck },
            ]
        },
        {
            id: 'catalogue',
            title: t('groups.catalogue'),
            icon: Package,
            items: [
                { name: t('items.products'), href: '/products', icon: Package },
                { name: t('items.families'), href: '/product-families', icon: FolderTree },
            ]
        },
        {
            id: 'production',
            title: t('groups.production'),
            icon: Factory,
            items: [
                { name: t('items.inventory'), href: '/inventory', icon: ClipboardList },
                { name: t('items.manufacturing'), href: '/manufacturing/orders', icon: Factory },
            ]
        },
        {
            id: 'finance',
            title: t('groups.finance'),
            icon: Receipt,
            items: [
                { name: t('items.invoices'), href: '/invoices', icon: Receipt },
                { name: t('items.aged_receivables'), href: '/treasury/aged-receivables', icon: History },
                { name: t('items.cash_flow'), href: '/treasury/forecast', icon: LineChart },
                { name: t('items.expenses'), href: '/expenses', icon: Wallet },
            ]
        },
        {
            id: 'analytics',
            title: t('groups.analytics'),
            icon: LineChart,
            items: [
                { name: t('items.analytics_overview'), href: '/analytics', icon: LineChart },
                { name: t('items.abc_analysis'), href: '/analytics/abc', icon: PieChart },
                { name: t('items.dead_stock'), href: '/analytics/dead-stock', icon: AlertCircle },
            ]
        },
        {
            id: 'hr',
            title: t('groups.hr'),
            icon: UserCog,
            items: [
                { name: t('items.hr_employees'), href: '/hr/employees', icon: Users },
                { name: t('items.hr_leaves'), href: '/hr/leaves', icon: ClipboardList },
                { name: t('items.hr_payroll'), href: '/hr/payroll', icon: Wallet },
                { name: t('items.hr_recruitment'), href: '/hr/recruitment', icon: UserPlus },
                { name: t('items.hr_performance'), href: '/hr/performance', icon: TrendingUp },
            ]
        },
        {
            id: 'collaboration',
            title: t('groups.collaboration'),
            icon: Calendar,
            items: [
                { name: t('items.collaboration_calendar'), href: '/collaboration/calendar', icon: Calendar },
                { name: t('items.collaboration_projects'), href: '/collaboration/projects', icon: FolderTree },
                { name: t('items.collaboration_activity'), href: '/collaboration/activity', icon: History },
            ]
        }
    ];

    return (
        <aside
            className={`
                bg-white border-r border-slate-100 shadow-xl transition-all duration-300 z-50 sticky top-0 h-screen flex flex-col shrink-0
                ${collapsed ? 'w-[70px]' : 'w-[280px]'}
            `}
        >
            {/* Header / Brand */}
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
            <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 space-y-2">
                {menuStructure.map((group) => {
                    const isExpanded = expandedSections.includes(group.id);
                    const GroupIcon = group.icon;

                    return (
                        <div key={group.id} className="px-3">
                            <button
                                onClick={() => !collapsed && toggleSection(group.id)}
                                className={`
                                    w-full flex items-center gap-3 h-11 rounded-xl transition-all
                                    ${collapsed ? 'justify-center px-0' : 'px-4'}
                                    ${isExpanded && !collapsed ? 'bg-slate-50/50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}
                                `}
                            >
                                <GroupIcon size={20} className="shrink-0" />
                                {!collapsed && (
                                    <>
                                        <span className="flex-1 text-[13px] font-bold text-left whitespace-nowrap overflow-hidden text-ellipsis">
                                            {group.title}
                                        </span>
                                        <ChevronRight 
                                            size={14} 
                                            className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                                        />
                                    </>
                                )}
                            </button>

                            {/* Sub-items */}
                            {!collapsed && isExpanded && (
                                <div className="mt-1 space-y-1 ml-4 border-l border-slate-100 pl-4 animate-in slide-in-from-top-2 duration-300">
                                    {group.items.map((item) => {
                                        if (item.permission && !hasPermission(item.permission.module, item.permission.resource, item.permission.action)) {
                                            return null;
                                        }

                                        const ItemIcon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href as any}
                                                className={`
                                                    flex items-center gap-3 h-10 px-4 rounded-lg transition-all
                                                    ${isActive 
                                                        ? 'bg-blue-50 text-blue-600 font-bold' 
                                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}
                                                `}
                                            >
                                                <ItemIcon size={16} className="shrink-0" />
                                                <span className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {item.name}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-3 border-t border-slate-50 bg-slate-50/30">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`
                        flex items-center rounded-xl transition-all h-11 w-full
                        ${collapsed ? 'justify-center px-0' : 'px-4 gap-4'}
                        text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 font-bold
                    `}
                >
                    {collapsed ? (
                        <ChevronRight size={20} />
                    ) : (
                        <>
                            <ChevronLeft size={20} />
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-60">
                                {t('items.settings') || 'REDUCE'}
                            </span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
