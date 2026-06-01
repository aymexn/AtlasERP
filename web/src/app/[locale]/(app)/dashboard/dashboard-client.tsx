'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import {
    LayoutDashboard,
    Activity,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Wallet,
    ShieldCheck,
    ArrowDownRight,
    Building2,
    ShoppingCart,
    Receipt,
    DollarSign,
    Users,
    Calendar,
    ChevronRight,
    Search,
    Plus,
    Factory,
    UserPlus,
    History,
    ArrowRight,
    Truck,
    BarChart3,
    Clock,
    FileText,

    RefreshCw
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/hooks/useWebSocket';

// Custom Health Score Gauge
const HealthScoreGauge = ({ score }: { score: number }) => {
    const t = useTranslations('dashboard');
    const getColor = (s: number) => {
        if (s >= 80) return '#10b981';
        if (s >= 60) return '#3b82f6';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getStatus = (s: number) => {
        if (s >= 80) return t('gauge.excellent');
        if (s >= 60) return t('gauge.good');
        if (s >= 40) return t('gauge.warning');
        return t('gauge.critical');
    };

    const color = getColor(score);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative">
            <svg className="w-48 h-48 transform -rotate-90">
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-100"
                />
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke={color}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-slate-900">{score}</span>
                <span className="text-[10px] font-black tracking-widest" style={{ color }}>{getStatus(score)}</span>
            </div>
        </div>
    );
};

export default function DashboardClient() {
    const t = useTranslations('dashboard');
    const ct = useTranslations('common');
    const locale = useLocale();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    const loadDashboard = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [
                overviewRes, 
                productionRes, 
                financialRes, 
                hrRes, 
                logisticsRes, 
                salesRes, 
                activityRes, 
                kpisRes, 
                healthRes,
                tenantData
            ] = await Promise.all([
                dashboardService.getOverview(),
                dashboardService.getProduction(),
                dashboardService.getFinancial(),
                dashboardService.getHR(),
                dashboardService.getLogistics(),
                dashboardService.getSales(),
                dashboardService.getActivity(),
                dashboardService.getKpis(),
                dashboardService.getHealth(),
                apiFetch('/tenants/me')
            ]);

            setStats({
                overview: overviewRes.data,
                production: productionRes.data,
                financial: financialRes.data,
                hr: hrRes.data,
                procurement: logisticsRes.data,
                sales: salesRes.data,
                recentActivity: activityRes.data,
                kpis: kpisRes.data,
                healthData: healthRes.data,
                health: kpisRes.data?.health || { score: 85, factors: {} }
            });
            setTenant(tenantData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        loadDashboard();
    }, []);

    // Connect to WebSocket room for real-time KPI updates
    useWebSocket(tenant?.id, () => {
        const isUserTyping = typeof document !== 'undefined' && (
            document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA' ||
            document.activeElement?.hasAttribute('contenteditable') ||
            document.activeElement?.closest('[contenteditable="true"]')
        );
        if (!isUserTyping) {
            loadDashboard(true);
        }
    });

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className="max-w-[1600px] mx-auto space-y-12 p-8">
                <div className="h-20 w-1/3 bg-slate-100 animate-pulse rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="h-[400px] bg-slate-50 animate-pulse rounded-3xl lg:col-span-2" />
                    <div className="h-[400px] bg-slate-50 animate-pulse rounded-3xl" />
                </div>
                <KpiSkeleton />
                <ChartSkeleton />
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

    const QuickActions = () => (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
                { label: t('quick_actions.sale'), icon: Plus, href: '/sales/orders', color: 'bg-blue-500' },
                { label: t('quick_actions.purchase'), icon: ShoppingCart, href: '/purchases/orders', color: 'bg-amber-500' },
                { label: t('quick_actions.manufacturing'), icon: Factory, href: '/manufacturing/orders', color: 'bg-emerald-500' },
                { label: t('quick_actions.invoice'), icon: FileText, href: '/invoices', color: 'bg-rose-500' },
                { label: t('quick_actions.customer'), icon: UserPlus, href: '/sales/customers', color: 'bg-indigo-500' },
                { label: t('quick_actions.stock'), icon: BarChart3, href: '/inventory/products-stock', color: 'bg-slate-800' },
                { label: t('quick_actions.tasks'), icon: Calendar, href: '/collaboration/projects', color: 'bg-violet-500' },
            ].map((action, i) => (
                <Link 
                    key={i} 
                    href={action.href as any}
                    className="group flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-[32px] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                >
                    <div className={`p-3 ${action.color} text-white rounded-2xl mb-3 shadow-lg shadow-black/5 group-hover:scale-110 transition-all`}>
                        <action.icon size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center">{action.label}</span>
                </Link>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20 p-8 animate-in fade-in duration-1000">
            {/* --- TOP BAR --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        {t('title')}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Building2 size={16} />
                        <span className="text-sm font-bold">{tenant?.name || 'AtlasERP'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={async () => {
                            setLoading(true);
                            try {
                                await dashboardService.refreshKpis();
                                window.location.reload();
                            } catch (err) {
                                console.error(err);
                                setLoading(false);
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-sm font-black text-xs uppercase tracking-wider group"
                    >
                        <RefreshCw size={14} className="text-blue-400 group-hover:rotate-180 transition-transform duration-700" />
                        {t('actions.recalculate')}
                    </button>
                </div>
            </div>

            {/* --- SECTION 1: APERÇU AUJOURD'HUI (HERO METRICS) --- */}
            <section className="space-y-6">
                <SectionHeader title={t('sections.today_overview')} colorClass="bg-blue-600" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Trésorerie */}
                    <div className="bg-linear-to-br from-slate-900 to-slate-950 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Wallet size={80} />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">💰 {t('metrics.cash_on_hand')}</div>
                        <div className="text-3xl font-black whitespace-nowrap mb-3 currency-amount" suppressHydrationWarning>
                            {formatCurrency(stats?.financial?.cashFlow || 0, locale)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <span className="financial-number">{t('metrics.cash_increase_vs_yesterday')}</span>
                        </div>
                    </div>

                    {/* CA Mensuel */}
                    <div className="bg-linear-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <BarChart3 size={80} />
                        </div>
                        <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">📊 {t('metrics.monthly_revenue')}</div>
                        <div className="text-3xl font-black whitespace-nowrap mb-3 currency-amount" suppressHydrationWarning>
                            {formatCurrency(stats?.overview?.revenue?.current || 0, locale)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-200 font-bold">
                            <span>{t('metrics.stable_month')}</span>
                        </div>
                    </div>

                    {/* Objectif CA */}
                    {(() => {
                        const target = 30000;
                        const current = stats?.overview?.revenue?.current || 0;
                        const pct = (current / target) * 100;
                        const displayPercent = pct.toFixed(1) + '%';
                        const progressPct = Math.min(100, pct);
                        return (
                            <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🎯 {t('metrics.monthly_goal')} (<span className="currency-amount">{formatCurrency(target, locale)}</span>)</div>
                                <div className="text-3xl font-black text-slate-900 mb-3 financial-number">{displayPercent}</div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                        <div 
                                            className="h-full bg-linear-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                        <span>{t('metrics.achieved')}: <span className="currency-amount">{formatCurrency(current, locale)}</span></span>
                                        <span>{t('metrics.remaining')}: <span className="currency-amount">{formatCurrency(Math.max(0, target - current), locale)}</span></span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </section>

            {/* --- SECTION 2: TABLEAU DE BORD OPÉRATIONNEL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Santé de l'entreprise */}
                <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[48px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('metrics.company_health')}</h3>
                            <div className="text-xs font-black px-3 py-1.5 bg-slate-900 text-white rounded-full">
                                {stats?.healthData?.score || 80}/100
                            </div>
                        </div>

                        <div className="flex justify-center mb-8">
                            <HealthScoreGauge score={stats?.healthData?.score || 80} />
                        </div>

                        <div className="w-full space-y-3">
                            {[
                                { key: 'cashFlow', label: t('flux.title'), icon: '💰', desc: t('actual_cash'), tooltip: t('metrics.cash_tooltip') },
                                { key: 'stock', label: t('quick_actions.stock'), icon: '📦', desc: t('alerts.stock_low'), tooltip: t('metrics.stock_tooltip') },
                                { key: 'sales', label: t('quick_actions.sale'), icon: '📈', desc: t('sales_section'), tooltip: t('metrics.sales_tooltip') },
                                { key: 'hr', label: t('quick_actions.customer'), icon: '👥', desc: t('metrics.total_active_label'), tooltip: t('metrics.customers_tooltip') },
                            ].map((factor) => {
                                const metric = stats?.healthData?.metrics?.[factor.key];
                                let status = metric?.status || 'warning';
                                
                                let displayLabel = metric?.label || factor.desc;
                                let displayPct = metric?.pct || '—';
                                let tooltip = factor.tooltip;

                                if (factor.key === 'cashFlow') {
                                    displayLabel = `${formatCurrency(stats?.financial?.cashFlow || 0, locale)} ${t('metrics.in_cash')}`;
                                    displayPct = '↗ +15.0%';
                                    status = (stats?.financial?.cashFlow || 0) >= 0 ? 'good' : 'critical';
                                } else if (factor.key === 'stock') {
                                    const count = stats?.production?.stockAlerts || 0;
                                    displayLabel = count > 0 ? t('metrics.articles_in_alert', { count }) : t('metrics.optimal_level');
                                    displayPct = count > 0 ? t('metrics.action_required') : '100%';
                                    status = count > 3 ? 'critical' : count > 0 ? 'warning' : 'good';
                                } else if (factor.key === 'sales') {
                                    const count = stats?.overview?.sales?.current || 0;
                                    displayLabel = t('metrics.orders_this_month', { count });
                                    displayPct = t('metrics.stable_month').replace('→ ', '').replace('← ', '');
                                    status = count > 0 ? 'good' : 'warning';
                                } else if (factor.key === 'hr') {
                                    const newCust = stats?.healthData?.customers?.new || 0;
                                    const totalCust = stats?.healthData?.customers?.total || 0;
                                    displayLabel = t('metrics.active_customers_label', { count: totalCust });
                                    displayPct = newCust > 0 ? `+${newCust}` : t('metrics.stable_month').replace('→ ', '').replace('← ', '');
                                    status = totalCust > 0 ? 'good' : 'warning';
                                }

                                const statusDot = status === 'good' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
                                const statusColor = status === 'good' 
                                    ? 'border-emerald-100 bg-emerald-50/50' 
                                    : status === 'warning' 
                                        ? 'border-amber-100 bg-amber-50/50' 
                                        : 'border-rose-100 bg-rose-50/50';
                                const textColor = status === 'good' 
                                    ? 'text-emerald-700' 
                                    : status === 'warning' 
                                        ? 'text-amber-700' 
                                        : 'text-rose-700';

                                return (
                                    <div 
                                        key={factor.key} 
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border ${statusColor} transition-all hover:shadow-md cursor-help relative`}
                                        title={tooltip}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm">{statusDot}</span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{factor.label}</span>
                                                <span className="text-[9px] text-slate-400 font-medium">{displayLabel}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black tracking-wider ${textColor} financial-number`}>
                                                {displayPct}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Performance Commerciale (MoM Chart) */}
                {(() => {
                    const chartData = stats?.sales?.chartData || [];
                    const hasHistoricalData = chartData.filter((d: any) => d.revenue > 0).length >= 2;

                    let trendLabel = t('metrics.month_over_month');
                    let trendColor = "bg-slate-50 text-slate-700 border-slate-100";
                    let trendIcon = <TrendingUp size={14} />;

                    if (chartData.length >= 2) {
                        const currentMonthData = chartData[chartData.length - 1];
                        const previousMonthData = chartData[chartData.length - 2];
                        const currentRev = currentMonthData.revenue || 0;
                        const previousRev = previousMonthData.revenue || 0;

                        if (previousRev > 0) {
                            const diff = ((currentRev - previousRev) / previousRev) * 100;
                            if (diff > 0.5) {
                                trendLabel = t('metrics.vs_last_month', { percent: '+' + diff.toFixed(1) });
                                trendColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                trendIcon = <TrendingUp size={14} className="text-emerald-500" />;
                            } else if (diff < -0.5) {
                                trendLabel = t('metrics.vs_last_month', { percent: diff.toFixed(1) });
                                trendColor = "bg-rose-50 text-rose-700 border-rose-100";
                                trendIcon = <TrendingDown size={14} className="text-rose-500" />;
                            } else {
                                trendLabel = t('metrics.stable_vs_last_month');
                                trendColor = "bg-slate-50 text-slate-700 border-slate-100";
                                trendIcon = <TrendingUp size={14} className="text-slate-500" />;
                            }
                        } else if (currentRev > 0) {
                            trendLabel = t('metrics.plus_100_vs_last_month');
                            trendColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                            trendIcon = <TrendingUp size={14} className="text-emerald-500" />;
                        }
                    }

                    return (
                        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[48px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('sales_section')}</h3>
                                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${trendColor}`}>
                                        {trendIcon}
                                        <span>{trendLabel}</span>
                                    </div>
                                </div>

                                <div className="h-[320px] w-full mt-6 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(val) => [formatCurrency(val as number, locale), t('total_invoiced')]}
                                                labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                                            />
                                            <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                                                {chartData.map((entry: any, index: number) => {
                                                    const isLast = index === chartData.length - 1;
                                                    return <Cell key={`cell-${index}`} fill={isLast ? '#2563eb' : '#3b82f633'} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>

                                    {!hasHistoricalData && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-[6px] transition-all duration-500 z-10 p-6 text-center rounded-[32px]">
                                            <div className="p-4 bg-slate-900 text-white rounded-3xl mb-4 shadow-xl shadow-black/10">
                                                <BarChart3 size={24} />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest mb-2">{t('metrics.insufficient_history')}</h4>
                                            <p className="text-xs text-slate-500 font-medium max-w-sm">
                                                {t('metrics.insufficient_history_desc')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* --- SECTION 3: ACTIONS RAPIDES --- */}
            <section>
                <SectionHeader title={t('quick_actions.title')} colorClass="bg-blue-600" />
                <QuickActions />
            </section>

            {/* --- SECTION 4: FLUX ET FORTERESSES (OPERATIONAL BLOCKS) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Manufacturing */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col h-full hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                                <Factory size={20} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('production_overview')}</h3>
                        </div>
                        <Link href="/manufacturing/orders" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 flex-1">
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('active_orders')}</div>
                            <div className="text-2xl font-black text-slate-900 financial-number">{stats?.production?.activeOrders || 0}</div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('real_production_cost')}</div>
                            <div className="text-xl font-black text-emerald-600 whitespace-nowrap currency-amount">{formatCurrency(stats?.production?.realCost || 0, locale)}</div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('shortage_alerts')}</div>
                            <div className="text-xl font-black text-rose-500 financial-number">{stats?.production?.stockAlerts || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Financial Fortress */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col h-full hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform">
                                <Wallet size={20} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('financial_fortress')}</h3>
                        </div>
                        <Link href="/treasury/forecast" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Tresorerie Reelle */}
                        <div className="p-5 bg-slate-900 rounded-[24px] text-white">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">💰 {t('actual_cash')}</div>
                            <div className={`text-2xl font-black whitespace-nowrap ${(stats?.financial?.cashFlow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'} currency-amount`}>{formatCurrency(stats?.financial?.cashFlow || 0, locale)}</div>
                        </div>
                        {/* CA Facture */}
                        <div className="p-5 bg-blue-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">📊 {t('total_invoiced')}</div>
                            <div className="text-xl font-black text-slate-900 whitespace-nowrap currency-amount">{formatCurrency(stats?.financial?.invoicedRevenue || 0, locale)}</div>
                        </div>
                        {/* Encaisse with progress bar */}
                        <div className="p-5 bg-emerald-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">✅ {t('metrics.collected_cash')}</div>
                            <div className="text-xl font-black text-slate-900 whitespace-nowrap currency-amount">{formatCurrency(stats?.financial?.collected || 0, locale)}</div>
                            <div className="mt-3 h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, stats?.financial?.recoveryRate || 0)}%` }} />
                            </div>
                            <div className="text-[10px] font-black text-emerald-600 mt-1.5"><span className="financial-number">{(stats?.financial?.recoveryRate || 0).toFixed(1)}%</span> {t('metrics.recovery_rate_label')}</div>
                        </div>
                        {/* Profitabilite with trend */}
                        <div className="flex justify-between items-center p-5 bg-slate-50 rounded-[24px]">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📈 {t('profitability')}</span>
                                <div className="mt-1 h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, stats?.financial?.profitability || 0)}%` }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-slate-900 financial-number">{(stats?.financial?.profitability || 0).toFixed(1)}%</span>
                                {(stats?.financial?.profitability || 0) >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clients & Ventes */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col h-full hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-12 transition-transform">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('metrics.customers_and_sales')}</h3>
                        </div>
                        <Link href="/sales/customers" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                        {/* Side-by-Side Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex flex-col justify-between">
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{t('metrics.total_active_label')}</span>
                                <span className="text-2xl font-black text-slate-900 financial-number">{stats?.healthData?.customers?.total || 0}</span>
                            </div>
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex flex-col justify-between">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t('metrics.new_this_month_label')}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900 financial-number">{stats?.healthData?.customers?.new || 0}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap financial-number">
                                        ⚡ {stats?.healthData?.customers?.total > 0 ? ((stats.healthData.customers.new / stats.healthData.customers.total) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Separator & Top Client Section */}
                        {stats?.healthData?.latestCustomer && (
                            <div className="border-t border-slate-100 pt-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('metrics.top_customer_label')}</div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]" title={stats.healthData.latestCustomer.name}>
                                            {stats.healthData.latestCustomer.name}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {t('metrics.last_order_label')}: <span className="font-black text-slate-800 currency-amount">{formatCurrency(stats.healthData.latestCustomer.orderAmount, locale)}</span>
                                        </p>
                                    </div>
                                    <Link 
                                        href="/sales/customers" 
                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
                                    >
                                        {t('metrics.view_profile')} <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 5: ALERTS & LOGISTICS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Alerts */}
                <section>
                    <SectionHeader title={t('alerts.title')} colorClass="bg-rose-600" />
                    <div className="space-y-4">
                        {/* Low Stock Card */}
                        <div className="p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all group">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                                        {t('alerts.stock_low')}
                                    </div>
                                    <div className="text-xl font-black text-slate-900 mb-3">
                                        {t('metrics.articles_in_alert', { count: stats?.production?.stockAlerts || 0 })}
                                    </div>
                                    {stats?.production?.lowStockProducts && stats.production.lowStockProducts.length > 0 ? (
                                        <div className="space-y-2 mt-2">
                                            {stats.production.lowStockProducts.slice(0, 3).map((prod: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-slate-700 truncate max-w-[200px]" title={prod.name}>
                                                            {prod.name}
                                                        </span>
                                                        {prod.sku && (
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                                SKU: {prod.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-black text-rose-650 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap financial-number">
                                                        {prod.stockQuantity} / {prod.reorderPoint} {t('units')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-bold">{t('metrics.all_stocks_optimal')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Value Purchases in Transit */}
                        <div className="p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all group">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                                        {t('purchases_in_transit')}
                                    </div>
                                    <div className="text-xl font-black text-slate-900 whitespace-nowrap animate-in fade-in duration-300 currency-amount">
                                        {formatCurrency(stats?.procurement?.pendingValue || 0, locale)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Orders */}
                        <div className="p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all group">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                                        {t('active_orders')}
                                    </div>
                                    <div className="text-xl font-black text-slate-900">
                                        {t('metrics.orders_count', { count: stats?.overview?.sales?.current || 0 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Logistics */}
                <section>
                    <SectionHeader title={t('procurement_section')} colorClass="bg-amber-600" />
                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 h-full flex flex-col shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('purchases_in_transit')}</div>
                                <div className="text-4xl font-black text-slate-900 whitespace-nowrap currency-amount">{formatCurrency(stats?.procurement?.pendingValue || 0, locale)}</div>
                                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2"><span className="financial-number">{stats?.procurement?.pendingCount || 0}</span> {t('pending_orders')}</div>
                            </div>
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-[24px]">
                                <Truck size={32} />
                            </div>
                        </div>

                        <div className="flex-1 space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('metrics.top_suppliers_volume')}</h4>
                            {(stats?.procurement?.topSuppliers || []).length > 0 ? (
                                stats.procurement.topSuppliers.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]" title={s.name}>{s.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 whitespace-nowrap currency-amount">{formatCurrency(s.value, locale)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">{t('no_supplier_data')}</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* --- SECTION 6: TOP ARTICLES & ACTIVITÉ RÉCENTE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Top Articles Vendus */}
                <section>
                    <SectionHeader title={t('top_sales')} colorClass="bg-blue-600" />
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 h-full flex flex-col shadow-sm">
                        <div className="space-y-4 flex-1">
                            {(stats?.sales?.topSellingProducts || []).length > 0 ? (
                                stats.sales.topSellingProducts.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] hover:scale-[1.02] transition-transform">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg">
                                                📦
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]" title={p.name}>{p.name}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[150px]">SKU: {p.id.substring(0, 8)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900 whitespace-nowrap currency-amount">{formatCurrency(p.revenue, locale)}</div>
                                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest financial-number">{p.quantity} {t('units')}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">{t('no_sales_data')}</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Activité Récente */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <SectionHeader title={t('activity_log')} colorClass="bg-slate-900" />
                        <Link href="/settings/audit" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1">
                            {t('metrics.view_all')} <ArrowRight size={12} />
                        </Link>
                    </div>
                    
                    <div className="bg-white border border-slate-100 rounded-[40px] p-6 shadow-sm overflow-hidden h-full flex flex-col justify-between">
                        <div className="divide-y divide-slate-50">
                            {(stats?.recentActivity || []).length > 0 ? (
                                stats.recentActivity.slice(0, 10).map((activity: any, i: number) => {
                                    const CardContent = (
                                        <div className="py-4 first:pt-0 last:pb-0 hover:bg-slate-50/50 transition-all flex items-start gap-4 group cursor-pointer">
                                            <div className="relative shrink-0">
                                                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl shadow-sm text-slate-600 flex items-center justify-center w-10 h-10 group-hover:bg-slate-900 group-hover:text-white transition-all text-lg">
                                                    {activity.icon || '📝'}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            🕐 {formatRelativeTime(activity.timestamp)}
                                                        </span>
                                                        <span className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
                                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[80px]" title={activity.user}>
                                                            {activity.user}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 truncate" title={activity.action}>
                                                    {activity.action}
                                                </p>
                                            </div>
                                        </div>
                                    );

                                    return activity.link ? (
                                        <Link key={activity.id || i} href={activity.link as any}>
                                            {CardContent}
                                        </Link>
                                    ) : (
                                        <div key={activity.id || i}>
                                            {CardContent}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 text-center text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                                    {t('metrics.no_activity')}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
