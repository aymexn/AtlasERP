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
    Calendar,
    Sparkles,
    MessageSquare,
    Eye,
    CheckSquare,
    Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Can } from '@/components/guards/PermissionGuard';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/logo';

const Sidebar = () => {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'commerce', 'administration']);
    const { hasPermission: originalHasPermission } = usePermissions();
    const { user } = useAuth();

    useEffect(() => {
        const stored = localStorage.getItem('atlas_sidebar_collapsed');
        if (stored === 'true') {
            setCollapsed(true);
        }
        setMounted(true);
    }, []);

    const toggleCollapse = () => {
        const nextCollapsed = !collapsed;
        setCollapsed(nextCollapsed);
        localStorage.setItem('atlas_sidebar_collapsed', String(nextCollapsed));
    };

    const handleGroupClick = (groupId: string) => {
        setCollapsed(false);
        localStorage.setItem('atlas_sidebar_collapsed', 'false');
        if (!expandedSections.includes(groupId)) {
            setExpandedSections(prev => [...prev, groupId]);
        }
    };

    const isGroupActive = (group: any) => {
        if (group.id === 'administration') {
            return adminSubItems.some(item => pathname === item.href);
        }
        return group.items.some((item: any) => pathname === item.href);
    };

    const isDev = process.env.NODE_ENV === 'development';

    const hasPermission = (moduleOrPermission: string, resource?: string, action?: string) => {
        if (isDev || user?.role === 'ADMIN') return true;
        if (!resource || !action) {
            if (moduleOrPermission === 'USERS_VIEW') return originalHasPermission('users', 'user', 'read');
            if (moduleOrPermission === 'PERMISSIONS_VIEW') return originalHasPermission('roles', 'role', 'read');
            if (moduleOrPermission === 'AUDIT_VIEW') return originalHasPermission('audit', 'log', 'read');
            return false;
        }
        return originalHasPermission(moduleOrPermission, resource, action);
    };

    const adminSubItems = [
        {
            title: "Utilisateurs et Rôles",
            href: "/settings/users",
            icon: Users,
            visible: hasPermission('users', 'user', 'read')
        },
        {
            title: "Permissions d'Accès",
            href: "/settings/permissions",
            icon: Shield,
            visible: hasPermission('roles', 'role', 'read')
        },
        {
            title: "Journal d'Activité",
            href: "/settings/audit-logs",
            icon: History,
            visible: hasPermission('audit', 'log', 'read')
        },
        {
            title: "Paramètres Système",
            href: "/settings",
            icon: Settings,
            visible: true
        }
    ];

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
                { name: t('items.products'), href: '/catalogue/products', icon: Package },
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
            id: 'ai',
            title: t('groups.ai'),
            icon: Sparkles,
            items: [
                { name: t('items.ai_assistant'), href: '/ai/chat', icon: MessageSquare },
                { name: t('items.ai_insights'), href: '/ai/insights', icon: Eye },
                { name: t('items.ai_recommendations'), href: '/ai/recommendations', icon: CheckSquare },
                { name: t('items.ai_analytics'), href: '/ai/analytics', icon: TrendingUp },
                { name: t('items.ai_automations'), href: '/ai/automations', icon: Zap },
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

    if (!mounted) {
        return (
            <aside className="bg-white border-r border-slate-100 shadow-xl w-[280px] h-screen sticky top-0 flex flex-col shrink-0">
                <div className="w-full h-16 flex items-center border-b border-gray-100 bg-white px-5">
                    <Logo variant="full" width={130} height={36} />
                </div>
                <div className="flex-1 py-4 space-y-4 px-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-11 bg-slate-50 animate-pulse rounded-xl" />
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={`
                bg-white border-r border-slate-100 shadow-xl transition-all duration-300 z-50 sticky top-0 h-screen flex flex-col shrink-0
                ${collapsed ? 'w-16' : 'w-[280px]'}
            `}
        >
            {/* Header / Brand */}
            <div className={`w-full h-16 flex items-center border-b border-gray-100 bg-white ${collapsed ? 'justify-center px-0' : 'px-5'}`}>
                <Logo variant={collapsed ? 'icon-only' : 'full'} width={collapsed ? 32 : 130} height={collapsed ? 32 : 36} />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 space-y-2">
                {menuStructure.map((group) => {
                    const isExpanded = expandedSections.includes(group.id);
                    const GroupIcon = group.icon;
                    const active = isGroupActive(group);

                    return (
                        <div key={group.id} className="px-3 relative group/tooltip">
                            <button
                                onClick={() => collapsed ? handleGroupClick(group.id) : toggleSection(group.id)}
                                className={`
                                    w-full flex items-center gap-3 h-11 rounded-xl transition-all relative
                                    ${collapsed ? 'justify-center px-0' : 'px-4'}
                                    ${collapsed 
                                        ? (active ? 'bg-blue-50/75 text-blue-600' : 'text-slate-500 hover:bg-slate-50')
                                        : (isExpanded ? 'bg-slate-50/50 text-blue-600' : 'text-slate-500 hover:bg-slate-50')
                                    }
                                `}
                            >
                                <GroupIcon size={20} className={`shrink-0 ${collapsed && active ? 'text-blue-600' : ''}`} />
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

                            {/* Active border accent for collapsed mode */}
                            {active && collapsed && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />
                            )}

                            {/* Collapsed Tooltip */}
                            {collapsed && (
                                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {group.title}
                                </div>
                            )}

                            {/* Sub-items */}
                            {!collapsed && isExpanded && (
                                <div className="mt-1 space-y-1 ml-4 border-l border-slate-100 pl-4 animate-in slide-in-from-top-2 duration-300">
                                    {group.id === 'administration' ? (
                                        adminSubItems.filter(item => item.visible).map((subItem) => {
                                            const ItemIcon = subItem.icon;
                                            const isActive = pathname === subItem.href;

                                            return (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href as any}
                                                    className={`
                                                        flex items-center gap-3 h-10 px-4 rounded-lg transition-all
                                                        ${isActive 
                                                            ? 'bg-blue-50 text-blue-600 font-bold' 
                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}
                                                    `}
                                                >
                                                    <ItemIcon size={16} className="shrink-0" />
                                                    <span className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        {subItem.title}
                                                    </span>
                                                </Link>
                                            );
                                        })
                                    ) : (
                                        group.items.map((item) => {
                                            // Items with a permission property are guarded; items without are always shown
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
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-3 border-t border-slate-50 bg-slate-50/30">
                <button
                    onClick={toggleCollapse}
                    title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
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
