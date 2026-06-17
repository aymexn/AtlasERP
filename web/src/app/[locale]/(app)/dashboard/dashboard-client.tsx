'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import {
    Info,
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
    ComposedChart,
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Line,
    Cell,
    LabelList,
    ReferenceDot
} from 'recharts';

import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime, formatDA } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/hooks/useWebSocket';

const CustomTooltip = ({ active, payload, label, data }: any) => {
    if (active && payload && payload.length) {
        const currentVal = payload[0].value;
        const currentIndex = data.findIndex((d: any) => d.date === label);
        let diffPct = null;
        if (currentIndex > 0) {
            const prevVal = data[currentIndex - 1].revenue;
            if (prevVal > 0) {
                diffPct = ((currentVal - prevVal) / prevVal) * 100;
            }
        }

        return (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-4 select-none">
                <p className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-505 text-slate-500">
                        CA Facturé: <span className="font-black text-slate-900" dir="ltr">{formatDA(currentVal)}</span>
                    </p>
                    {diffPct !== null && (
                        <p className={`text-[10px] font-black flex items-center gap-1 ${diffPct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {diffPct >= 0 ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}% vs mois préc.
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

// 1. Custom Circular Goal Progress Ring
const CircularGoalProgress = ({ percentage, current, target, locale }: { percentage: number; current: number; target: number; locale: string }) => {
    const radius = 48; // 96px diameter
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;
    const ringColor = percentage > 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="flex flex-col items-center text-center bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 h-full justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Objectif Mensuel</span>
            
            <div className="relative flex items-center justify-center shrink-0 select-none my-2">
                <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke="#f8fafc"
                        strokeWidth="6"
                        fill="transparent"
                    />
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke={ringColor}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute text-base font-black text-slate-800" dir="ltr">
                    {percentage.toFixed(0)}%
                </span>
            </div>
            
            <div className="min-w-0 mt-2 w-full space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Réalisé</span>
                    <span className="font-black text-slate-900" dir="ltr" suppressHydrationWarning>{formatDA(current)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Objectif</span>
                    <span className="font-black text-slate-500" dir="ltr" suppressHydrationWarning>{formatDA(target)}</span>
                </div>
            </div>
        </div>
    );
};

// 2. Custom Health Score Donut Gauge
const HealthScoreGauge = ({ score }: { score: number }) => {
    const radius = 48; // 96px diameter
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#2563eb' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="flex flex-col items-center text-center bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 h-full justify-between">
            <div className="w-full flex items-center justify-center gap-1.5 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Santé Globale</span>
                <div className="relative group/tooltip cursor-pointer text-slate-400 hover:text-slate-600 flex items-center justify-center">
                    <Info size={12} />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 text-center font-medium shadow-lg leading-normal">
                        Calculé selon le niveau des stocks, la trésorerie et la profitabilité globale de l'entreprise.
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-center shrink-0 select-none my-2">
                <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke="#f8fafc"
                        strokeWidth="6"
                        fill="transparent"
                    />
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke={color}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute text-base font-black text-slate-800" dir="ltr">
                    {score}
                </span>
            </div>

            <div className="min-w-0 mt-2 w-full space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>État</span>
                    <span className="font-black uppercase tracking-wide" style={{ color }}>
                        {score >= 80 ? 'Excellente' : score >= 60 ? 'Bonne' : score >= 40 ? 'Attention' : 'Critique'}
                    </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Indice</span>
                    <span className="font-black text-slate-700">Efficience ERP</span>
                </div>
            </div>
        </div>
    );
};

// 3. Treasury Area Sparkline
const TreasurySparkline = ({ data, locale }: { data: any[]; locale: string }) => {
    const hasData = data && data.length > 0;
    const lastPoint = hasData ? data[data.length - 1] : null;

    return (
        <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Flux de Trésorerie</h3>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider">6 Mois</span>
                </div>
                <p className="text-xs text-slate-500 font-bold">Progression cumulative des soldes</p>
            </div>
            <div className="h-[220px] w-full mt-6">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="treasuryGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                formatter={(val) => [formatCurrency(val as number, locale), 'Trésorerie']}
                                labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#treasuryGrad)" />
                            {lastPoint && (
                                <ReferenceDot
                                    x={lastPoint.date}
                                    y={lastPoint.balance}
                                    r={5}
                                    fill="#2563eb"
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-355 text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Aucune donnée de trésorerie disponible — les transactions apparaîtront ici automatiquement
                    </div>
                )}
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

    // WebSocket room subscription for real-time dashboard refreshes
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
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[32px]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="h-[400px] bg-slate-50 animate-pulse rounded-3xl lg:col-span-2" />
                    <div className="h-[400px] bg-slate-50 animate-pulse rounded-3xl" />
                </div>
            </div>
        );
    }

    const SectionHeader = ({ title, colorClass = "bg-primary" }: { title: string; colorClass?: string }) => (
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-1.5 h-6 rounded-full ${colorClass}`} />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 select-none">
                {title}
            </h2>
        </div>
    );

    const QuickActions = () => (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
                { label: t('quick_actions.sale'), icon: Plus, href: '/sales/orders', color: 'bg-blue-600' },
                { label: t('quick_actions.purchase'), icon: ShoppingCart, href: '/purchases/orders', color: 'bg-amber-500' },
                { label: t('quick_actions.manufacturing'), icon: Factory, href: '/manufacturing/orders', color: 'bg-emerald-500' },
                { label: t('quick_actions.invoice'), icon: FileText, href: '/invoices', color: 'bg-rose-500' },
                { label: t('quick_actions.customer'), icon: UserPlus, href: '/sales/customers', color: 'bg-indigo-500' },
                { label: t('quick_actions.stock'), icon: BarChart3, href: '/inventory/stock-status', color: 'bg-slate-800' },
                { label: t('quick_actions.tasks'), icon: Calendar, href: '/collaboration/projects', color: 'bg-violet-500' },
            ].map((action, i) => (
                <Link 
                    key={i} 
                    href={action.href as any}
                    className="group flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-[32px] hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                >
                    <div className={`p-3 ${action.color} text-white rounded-2xl mb-3 shadow-lg shadow-black/5 group-hover:scale-110 transition-all`}>
                        <action.icon size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-650 text-center">{action.label}</span>
                </Link>
            ))}
        </div>
    );

    const target = Number(tenant?.settings?.monthly_revenue_target ?? 1000000);
    const currentRevenue = stats?.overview?.revenue?.current || 0;
    const goalPct = target > 0 ? (currentRevenue / target) * 100 : 0;

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20 p-8 animate-in fade-in duration-700">
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

            {/* --- SECTION 1: APERÇU HERO METRICS (4 CARDS) --- */}
            <section className="space-y-6">
                <SectionHeader title={t('sections.today_overview')} colorClass="bg-blue-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Treasury Card (Navy) */}
                    <div className="bg-[#0F1B2D] text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none">
                            <Wallet size={80} />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">💰 {t('metrics.cash_on_hand')}</div>
                        <div className="text-3xl font-black whitespace-nowrap mb-3 currency-amount" dir="ltr" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.875rem)' }} suppressHydrationWarning>
                            {formatDA(stats?.financial?.cashFlow || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold select-none">
                            <span className="financial-number">{t('metrics.cash_increase_vs_yesterday')}</span>
                        </div>
                    </div>

                    {/* 2. CA Mensuel Card (Blue Gradient) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-10 select-none">
                            <BarChart3 size={80} />
                        </div>
                        <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">📊 {t('metrics.monthly_revenue')}</div>
                        <div className="text-3xl font-black whitespace-nowrap mb-3 currency-amount" dir="ltr" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.875rem)' }} suppressHydrationWarning>
                            {formatDA(currentRevenue)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-200 font-bold select-none">
                            <span>{t('metrics.stable_month')}</span>
                        </div>
                    </div>

                    {/* 3. Circular Goal Progress Card (White) */}
                    <CircularGoalProgress percentage={goalPct} current={currentRevenue} target={target} locale={locale} />

                    {/* 4. Donut Health Score Card (White) */}
                    <HealthScoreGauge score={stats?.healthData?.score || 80} />
                </div>
            </section>

            {/* --- SECTION 2: CHARTS (MoM performance & Treasury Sparkline) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Commercial Performance Bar Chart (lg:col-span-8) */}
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
                        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[40px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('sales_section')}</h3>
                                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${trendColor}`}>
                                        {trendIcon}
                                        <span>{trendLabel}</span>
                                    </div>
                                </div>

                                <div className="h-[320px] w-full mt-6 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <Tooltip content={<CustomTooltip data={chartData} />} />
                                            <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                                                {chartData.map((entry: any, index: number) => {
                                                    const isLast = index === chartData.length - 1;
                                                    return <Cell key={`cell-${index}`} fill={isLast ? '#2563eb' : '#93c5fd'} />;
                                                })}
                                            </Bar>
                                            <Line 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="#2563eb" 
                                                strokeWidth={2.5} 
                                                dot={{ r: 4, fill: '#2563eb', strokeWidth: 1 }} 
                                                activeDot={{ r: 6 }}
                                            />
                                        </ComposedChart>
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

                {/* Treasury Progression Area Sparkline (lg:col-span-4) */}
                <div className="lg:col-span-4">
                    <TreasurySparkline data={stats?.financial?.treasuryHistory} locale={locale} />
                </div>
            </div>

            {/* --- SECTION 3: ACTIONS RAPIDES --- */}
            <section>
                <SectionHeader title={t('quick_actions.title')} colorClass="bg-blue-600" />
                <QuickActions />
            </section>

            {/* --- SECTION 4: TABLEAU DE BORD OPÉRATIONNEL (3-COLUMN LAYOUT) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Production */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col h-full hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                                <Factory size={20} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('production_overview')}</h3>
                        </div>
                        <Link href="/manufacturing/orders" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                        {/* Compact Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 rounded-2xl text-center flex flex-col justify-between min-w-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 truncate" title={t('active_orders')}>{t('active_orders')}</span>
                                <span className="text-base font-black text-slate-900 financial-number" dir="ltr">{stats?.production?.activeOrders || 0}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl text-center flex flex-col justify-between min-w-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 truncate" title={t('real_production_cost')}>{t('real_production_cost')}</span>
                                <span className="text-[11px] font-black text-emerald-600 truncate currency-amount" dir="ltr" title={formatDA(stats?.production?.realCost || 0)} suppressHydrationWarning>{formatDA(stats?.production?.realCost || 0)}</span>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-center flex flex-col justify-between min-w-0">
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider mb-1 truncate" title={t('shortage_alerts')}>{t('shortage_alerts')}</span>
                                <span className="text-base font-black text-rose-600 financial-number" dir="ltr">{stats?.production?.stockAlerts || 0}</span>
                            </div>
                        </div>

                        {/* Active Orders List */}
                        <div className="border-t border-slate-100 pt-4 flex-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ordres de Fabrication</h4>
                            {stats?.production?.activeOrdersDetails && stats.production.activeOrdersDetails.length > 0 ? (
                                <div className="space-y-3.5">
                                    {stats.production.activeOrdersDetails.slice(0, 3).map((order: any, idx: number) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-slate-900 truncate max-w-[140px]" title={order.productName}>
                                                    {order.productName}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider" dir="ltr">
                                                    Ref: {order.reference}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                                        style={{ width: `${order.progress}%` }} 
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 min-w-[28px] text-right financial-number" dir="ltr">
                                                    {order.progress}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                                <span>Produit: <strong className="text-slate-700 financial-number" dir="ltr">{order.producedQuantity}</strong> / <span className="financial-number" dir="ltr">{order.plannedQuantity}</span> {order.unit || 'u'}</span>
                                                <span className={`uppercase tracking-widest ${order.status === 'IN_PROGRESS' ? 'text-blue-500' : 'text-amber-500'}`}>
                                                    {order.status === 'IN_PROGRESS' ? 'En Cours' : 'Planifié'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400 font-black uppercase tracking-widest text-[9px]">
                                    Aucun ordre de fabrication actif
                                </div>
                            )}
                        </div>

                        {/* View All / Alerts Link */}
                        <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                            {stats?.production?.stockAlerts > 0 ? (
                                <div className="flex items-center gap-1.5 text-xs text-rose-500 font-bold">
                                    <AlertTriangle size={12} />
                                    <span>{stats.production.stockAlerts} alertes rupture</span>
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-400 font-bold">✓ Stocks & production alignés</span>
                            )}
                            <Link 
                                href="/manufacturing/orders" 
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 hover:underline transition-all"
                            >
                                Voir tous <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Column 2: Financial Fortress */}
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
                        <div className="p-5 bg-[#0F1B2D] rounded-[24px] text-white">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">💰 {t('actual_cash')}</div>
                            <div className={`text-2xl font-black whitespace-nowrap ${(stats?.financial?.cashFlow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'} currency-amount`} suppressHydrationWarning>{formatDA(stats?.financial?.cashFlow || 0)}</div>
                        </div>
                        {/* CA Facture */}
                        <div className="p-5 bg-blue-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">📊 {t('total_invoiced')}</div>
                            <div className="text-xl font-black text-slate-900 whitespace-nowrap currency-amount" suppressHydrationWarning>{formatDA(stats?.financial?.invoicedRevenue || 0)}</div>
                        </div>
                        {/* Encaisse with progress bar */}
                        <div className="p-5 bg-emerald-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">✅ {t('metrics.collected_cash')}</div>
                            <div className="text-xl font-black text-slate-900 whitespace-nowrap currency-amount" suppressHydrationWarning>{formatDA(stats?.financial?.collected || 0)}</div>
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

                {/* Column 3: Clients & Ventes */}
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

                        {/* Top Client Section */}
                        {stats?.healthData?.latestCustomer && (
                            <div className="border-t border-slate-100 pt-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('metrics.top_customer_label')}</div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]" title={stats.healthData.latestCustomer.name}>
                                            {stats.healthData.latestCustomer.name}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {t('metrics.last_order_label')}: <span className="font-black text-slate-800 currency-amount" suppressHydrationWarning>{formatDA(stats.healthData.latestCustomer.orderAmount)}</span>
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
                {/* Alerts (Low Stock) */}
                <section>
                    <SectionHeader title={t('alerts.title')} colorClass="bg-rose-600" />
                    <div className="space-y-4">
                        {/* Low Stock Listing Card */}
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
                                                    <span className="font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap financial-number">
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
                                    <div className="text-xl font-black text-slate-900 whitespace-nowrap currency-amount" suppressHydrationWarning>
                                        {formatDA(stats?.procurement?.pendingValue || 0)}
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

                {/* Procurement / Supplier volume */}
                <section>
                    <SectionHeader title={t('procurement_section')} colorClass="bg-amber-600" />
                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 h-full flex flex-col shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('purchases_in_transit')}</div>
                                <div className="text-4xl font-black text-slate-900 whitespace-nowrap currency-amount" suppressHydrationWarning>{formatDA(stats?.procurement?.pendingValue || 0)}</div>
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
                                        <span className="text-xs font-black text-slate-900 whitespace-nowrap currency-amount" suppressHydrationWarning>{formatDA(s.value)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-350 font-black uppercase tracking-widest text-[10px]">{t('no_supplier_data')}</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* --- SECTION 6: TOP ARTICLES & ACTIVITÉ RÉCENTE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Top Selling Products */}
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
                                            <div className="text-sm font-black text-slate-900 whitespace-nowrap currency-amount" suppressHydrationWarning>{formatDA(p.revenue)}</div>
                                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest financial-number">{p.quantity} {t('units')}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-350 font-black uppercase tracking-widest text-[10px]">{t('no_sales_data')}</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Audit Log / Recent Activity */}
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
