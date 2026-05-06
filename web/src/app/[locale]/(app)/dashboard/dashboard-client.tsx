'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import {
    LayoutDashboard,
    Activity,
    PackageCheck,
    TrendingUp,
    AlertTriangle,
    Wallet,
    ShieldCheck,
    ArrowDownRight,
    Building2,
    ShoppingCart,
    Receipt,
    DollarSign
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';
import { TableSkeleton, KpiSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { 
    Plus, 
    FileText, 
    Truck, 
    UserPlus, 
    ArrowRightLeft,
    ChevronRight,
    Search
} from 'lucide-react';

export default function DashboardClient() {
    const t = useTranslations('dashboard');
    const ct = useTranslations('common');
    const locale = useLocale();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const loadDashboard = async () => {
            try {
                const [dashboardData, tenantData] = await Promise.all([
                    dashboardService.getProductionStats(),
                    apiFetch('/tenants/me')
                ]);
                setStats(dashboardData);
                setTenant(tenantData);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (!isMounted) return null;

    const SectionHeader = ({ title, colorClass = "bg-primary" }: { title: string; colorClass?: string }) => (
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-1.5 h-6 rounded-full ${colorClass}`} />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                {title}
            </h2>
        </div>
    );

    if (loading) {
        return (
            <div className="max-w-[1600px] mx-auto space-y-16 pb-20 p-8">
                <div className="flex justify-between items-center mb-12">
                   <div className="space-y-4">
                        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
                        <div className="h-4 w-48 bg-slate-100 animate-pulse rounded-lg" />
                   </div>
                </div>
                <KpiSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <ChartSkeleton />
                    <div className="space-y-8">
                        <div className="h-48 bg-slate-50 animate-pulse rounded-3xl" />
                        <div className="h-48 bg-slate-50 animate-pulse rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    const QuickActions = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {[
                { label: ct('create_so' as any) || 'Vente', icon: Plus, href: '/sales/orders/new', color: 'bg-blue-500' },
                { label: ct('create_po' as any) || 'Achat', icon: ShoppingCart, href: '/purchases/orders/new', color: 'bg-amber-500' },
                { label: ct('create_mo' as any) || 'Fabrication', icon: Activity, href: '/manufacturing/orders/new', color: 'bg-emerald-500' },
                { label: ct('new_customer' as any) || 'Client', icon: UserPlus, href: '/customers/new', color: 'bg-indigo-500' },
                { label: ct('inventory_check' as any) || 'Inventaire', icon: Search, href: '/inventory', color: 'bg-slate-700' },
                { label: ct('finance_report' as any) || 'Trésorerie', icon: Wallet, href: '/finance/treasury', color: 'bg-rose-500' },
            ].map((action, i) => (
                <Link 
                    key={i} 
                    href={action.href}
                    className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all"
                >
                    <div className={`p-3 ${action.color} text-white rounded-xl mb-3 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                        <action.icon size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{action.label}</span>
                </Link>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 pb-20 p-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Header & Quick Actions */}
            <div>
                <PageHeader
                    title={t('title')}
                    subtitle={tenant?.name || t('company_overview' as any)}
                    icon={LayoutDashboard}
                />
                <QuickActions />
            </div>

            {/* Part 2: Operational Command Center (High-End 3-Column Grid) */}
            <section>
                <SectionHeader title={t('production_overview')} colorClass="bg-primary" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <KpiCard
                        title={t('active_orders')}
                        value={stats?.orders?.active || 0}
                        icon={Activity}
                        variant="primary"
                        type="count"
                    />
                    <KpiCard
                        title={t('real_production_cost')}
                        value={stats?.costs?.actual || 0}
                        icon={TrendingUp}
                        variant="info"
                        type="currency"
                    />
                    <KpiCard
                        title={t('shortage_alerts')}
                        value={(stats?.alerts?.outOfStock || 0) + (stats?.alerts?.lowStock || 0)}
                        icon={AlertTriangle}
                        variant="danger"
                        type="count"
                    />
                </div>
            </section>

            {/* Part 3: Financial Fortress & Performance */}
            <section>
                <SectionHeader title={t('financial_fortress')} colorClass="bg-primary" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    <KpiCard
                        title={t('total_invoiced')}
                        value={stats?.finances?.invoiced || 0}
                        icon={Receipt}
                        variant="slate"
                        type="currency"
                    />
                    <KpiCard
                        title={t('flux.collected')}
                        value={stats?.finances?.collected || 0}
                        icon={TrendingUp}
                        variant="success"
                        type="currency"
                        subtitle={`${((stats?.finances?.collected / (stats?.finances?.invoiced || 1)) * 100).toFixed(1)}% ${t('flux.recovery')}`}
                    />
                    <KpiCard
                        title={t('actual_cash' as any)}
                        value={stats?.finances?.actualCash || 0}
                        icon={DollarSign}
                        variant="primary"
                        type="currency"
                    />
                    <KpiCard
                        title={t('cash_position')}
                        value={stats?.finances?.cashPosition || 0}
                        icon={Wallet}
                        variant="info"
                        type="currency"
                    />
                    <KpiCard
                        title={t('profitability')}
                        value={stats?.finances?.netProfit || 0}
                        icon={ShieldCheck}
                        variant="success"
                        type="currency"
                        trend={{
                            value: stats?.finances?.marginPercent || 0,
                            label: t('margin_percent'),
                            isPositive: (stats?.finances?.netProfit || 0) > 0
                        }}
                    />
                </div>
            </section>

            {/* Part 4: Operational Intelligence & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section>
                    <SectionHeader title={t('alerts.title')} colorClass="bg-danger" />
                    <div className="bg-white border-2 border-red-50 rounded-3xl p-8 space-y-6 shadow-xl shadow-red-500/5">
                        <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">{t('alerts.stock_low')}</div>
                                    <div className="text-xl font-black text-blue-600" suppressHydrationWarning>{(stats?.alerts?.outOfStock || 0) + (stats?.alerts?.lowStock || 0)} {t('articles')}</div>
                                </div>
                            </div>
                            <Link href="/inventory" className="p-3 hover:bg-red-100 rounded-xl transition-all text-red-500"><ArrowDownRight size={24} /></Link>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-200">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('alerts.pending_invoices')}</div>
                                    <div className="text-xl font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.finances?.netGap || 0)}</div>
                                </div>
                            </div>
                            <Link href="/invoices" className="p-3 hover:bg-blue-100 rounded-xl transition-all text-blue-500"><ArrowDownRight size={24} /></Link>
                        </div>
                    </div>
                </section>

                <section>
                    <SectionHeader title={t('flux.title')} colorClass="bg-blue-600" />
                    <div className="bg-white border-2 border-slate-50 rounded-3xl p-8 space-y-8 shadow-xl shadow-slate-200/40">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('flux.gap')}</div>
                                <div className="text-3xl font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.finances?.netGap || 0)}</div>
                            </div>
                            {(() => {
                                const gap = stats?.finances?.netGap || 0;
                                if (gap > 0) return <Badge variant="active" className="bg-amber-500 text-white border-none px-4 py-2 text-[10px] font-black">{t('flux.receivables')}</Badge>;
                                if (gap < 0) return <Badge variant="active" className="bg-blue-500 text-white border-none px-4 py-2 text-[10px] font-black">{t('flux.positive')}</Badge>;
                                return <Badge variant="active" className="bg-blue-500 text-white border-none px-4 py-2 text-[10px] font-black">{t('flux.stable')}</Badge>;
                            })()}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('flux.invoiced')}</div>
                                <div className="text-lg font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.finances?.invoiced || 0)}</div>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{t('flux.collected')}</div>
                                <div className="text-lg font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.finances?.collected || 0)}</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>


            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Procurement Snapshot */}
                <section>
                    <SectionHeader title={t('procurement_section')} colorClass="bg-warning" />
                    <div className="bg-card border border-border rounded-2xl p-8 space-y-8 h-full flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('purchases_in_transit')}</span>
                                <span className="text-2xl font-black text-foreground tracking-tighter" suppressHydrationWarning>
                                    {formatCurrency(stats?.procurement?.pendingValue || 0)}
                                </span>
                            </div>
                            <Badge variant="confirmed">
                                {stats?.procurement?.pendingCount || 0} {t('pending_orders')}
                            </Badge>
                        </div>

                        <div className="flex-1 space-y-4">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('top_suppliers')}</h4>
                            <div className="space-y-3">
                                {(stats?.procurement?.topSuppliers || []).map((s: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-card rounded-lg border border-border">
                                                <Building2 size={14} className="text-muted-foreground" />
                                            </div>
                                            <span className="text-sm font-bold text-foreground">{s.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-foreground" suppressHydrationWarning>{formatCurrency(s.value)}</span>
                                    </div>
                                ))}
                                {(!stats?.procurement?.topSuppliers || stats.procurement.topSuppliers.length === 0) && (
                                    <div className="text-[10px] text-center text-muted-foreground/40 py-12 font-black uppercase tracking-widest">{t('no_supplier_data')}</div>
                                )}
                            </div>
                        </div>

                        <Link href="/purchases/orders" className="flex items-center justify-center gap-2 w-full py-4 bg-muted text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all mt-auto">
                            <ShoppingCart size={14} /> {t('access_command_center')}
                        </Link>
                    </div>
                </section>

                {/* Sales Velocity */}
                <section>
                    <SectionHeader title={t('sales_section')} colorClass="bg-primary" />
                    <div className="bg-card border border-border rounded-2xl p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('monthly_sales')}</span>
                                <span className="text-2xl font-black text-foreground tracking-tighter" suppressHydrationWarning>
                                    {formatCurrency(stats?.sales?.monthlyRevenue || 0)}
                                </span>
                            </div>
                            <Badge variant="active">
                                {stats?.sales?.activeOrders || 0} {t('active_orders')}
                            </Badge>
                        </div>

                        {/* Chart Component added safely within condition */}
                        {stats?.sales?.chartData && stats.sales.chartData.length > 0 && (
                            <div className="h-[200px] w-full mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.sales.chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorProcurement" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any, name: any) => [
                                                formatCurrency(value), 
                                                name === 'revenue' ? t('chart.revenue' as any) || 'Ventes' : t('chart.procurement' as any) || 'Achats'
                                            ]}
                                            labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        <Area type="monotone" dataKey="procurement" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorProcurement)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="flex-1 space-y-4">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('top_sales')}</h4>
                            <div className="space-y-3">
                                {(stats?.sales?.topSellingProducts || []).slice(0, 3).map((p: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-card rounded-lg border border-border">
                                                <Activity size={14} className="text-muted-foreground" />
                                            </div>
                                            <span className="text-sm font-bold text-foreground">{p.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-foreground" suppressHydrationWarning>{formatCurrency(p.revenue)}</span>
                                    </div>
                                ))}
                                {(!stats?.sales?.topSellingProducts || stats.sales.topSellingProducts.length === 0) && (
                                    <div className="text-[10px] text-center text-muted-foreground/40 py-12 font-black uppercase tracking-widest">{t('no_sales_data')}</div>
                                )}
                            </div>
                        </div>

                        <Link href="/sales/orders" className="flex items-center justify-center gap-2 w-full py-4 bg-muted text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all mt-auto">
                            <TrendingUp size={14} /> {t('access_sales_cockpit')}
                        </Link>

                    </div>
                </section>
            </div>
        </div>
    );
}
