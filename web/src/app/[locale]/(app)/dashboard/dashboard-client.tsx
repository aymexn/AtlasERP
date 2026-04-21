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
    Receipt
} from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

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

    if (!isMounted || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{ct('loading')}</div>
            </div>
        );
    }


    const SectionHeader = ({ title, colorClass = "bg-primary" }: { title: string; colorClass?: string }) => (
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-1.5 h-6 rounded-full ${colorClass}`} />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                {title}
            </h2>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 pb-20 animate-in fade-in duration-1000">
            {/* Header */}
            <PageHeader
                title={t('title')}
                subtitle={tenant?.name || t('company_overview' as any)}
                icon={LayoutDashboard}
            />

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
                    />
                    <KpiCard
                        title={t('shortage_alerts')}
                        value={stats?.procurement?.pendingCount || 0}
                        icon={AlertTriangle}
                        variant="danger"
                        type="count"
                    />
                </div>
            </section>

            {/* Part 3: Financial Fortress & Performance */}
            <section>
                <SectionHeader title={t('financial_fortress')} colorClass="bg-primary" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <KpiCard
                        title={t('total_invoiced')}
                        value={stats?.finances?.totalRevenue || 0}
                        icon={Receipt}
                        variant="success"
                    />
                    <KpiCard
                        title={t('cash_position')}
                        value={stats?.finances?.cashPosition || 0}
                        icon={Wallet}
                        variant="primary"
                    />
                    <KpiCard
                        title={t('profitability')}
                        value={(stats?.finances?.totalRevenue || 0) - (stats?.finances?.totalCogs || 0)}
                        icon={ShieldCheck}
                        variant="success"
                        trend={{
                            value: stats?.finances?.totalRevenue > 0 ? Math.round(((stats.finances.totalRevenue - stats.finances.totalCogs) / stats.finances.totalRevenue) * 100) : 0,
                            label: t('margin_percent'),
                            isPositive: (stats?.finances?.totalRevenue - stats?.finances?.totalCogs) > 0
                        }}
                    />
                </div>
            </section>

            {/* Part 4: Operational Intelligence & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section>
                    <SectionHeader title={t('alerts.title')} colorClass="bg-danger" />
                    <div className="bg-white border-2 border-red-50 rounded-4xl p-8 space-y-6 shadow-xl shadow-red-500/5">
                        <div className="flex items-center justify-between p-6 bg-red-50/50 rounded-3xl border border-red-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">{t('alerts.stock_low')}</div>
                                    <div className="text-xl font-black text-blue-600" suppressHydrationWarning>{stats?.procurement?.pendingCount || 0} Articles</div>
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
                                    <div className="text-xl font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.finances?.totalRevenue - stats?.finances?.cashPosition || 0)}</div>
                                </div>
                            </div>
                            <Link href="/invoices" className="p-3 hover:bg-blue-100 rounded-xl transition-all text-blue-500"><ArrowDownRight size={24} /></Link>
                        </div>
                    </div>
                </section>

                <section>
                    <SectionHeader title={t('flux.title')} colorClass="bg-blue-600" />
                    <div className="bg-white border-2 border-blue-50 rounded-4xl p-8 space-y-8 shadow-xl shadow-blue-500/5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('flux.gap')}</div>
                                <div className="text-3xl font-black text-blue-600" suppressHydrationWarning>{formatCurrency((stats?.sales?.monthlyRevenue || 0) - (stats?.finances?.cashPosition || 0))}</div>
                            </div>
                            {(() => {
                                const gap = (stats?.sales?.monthlyRevenue || 0) - (stats?.finances?.cashPosition || 0);
                                if (gap > 1000) return <Badge variant="cancelled" className="bg-red-500 text-white border-none px-4 py-2 text-[10px] font-black">{t('flux.negative')}</Badge>;
                                if (gap < -1000) return <Badge variant="active" className="bg-blue-500 text-white border-none px-4 py-2 text-[10px] font-black">{t('flux.positive')}</Badge>;
                                return <Badge variant="active" className="bg-blue-500 text-white border-none px-4 py-2 text-[10px] font-black">{t('flux.stable')}</Badge>;
                            })()}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('flux.invoiced')}</div>
                                <div className="text-lg font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.sales?.monthlyRevenue || 0)}</div>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{t('flux.collected')}</div>
                                <div className="text-lg font-black text-blue-600" suppressHydrationWarning>{formatCurrency(stats?.finances?.cashPosition || 0)}</div>
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
                    <div className="bg-card border border-border rounded-2xl p-8 space-y-8 h-full flex flex-col">
                        <div className="flex items-center justify-between">
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
