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
import { formatCurrency } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/hooks/useWebSocket';

// Custom Health Score Gauge
const HealthScoreGauge = ({ score }: { score: number }) => {
    const getColor = (s: number) => {
        if (s >= 80) return '#10b981';
        if (s >= 60) return '#3b82f6';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getStatus = (s: number) => {
        if (s >= 80) return 'EXCELLENT';
        if (s >= 60) return 'BON';
        if (s >= 40) return 'ATTENTION';
        return 'CRITIQUE';
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

        // 30s polling fallback
        const interval = setInterval(() => {
            loadDashboard(true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Connect to WebSocket room for real-time KPI updates
    useWebSocket(tenant?.id, () => {
        loadDashboard(true);
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
                { label: 'Vente', icon: Plus, href: '/sales/orders', color: 'bg-blue-500' },
                { label: 'Achat', icon: ShoppingCart, href: '/purchases/orders', color: 'bg-amber-500' },
                { label: 'Fabrication', icon: Factory, href: '/manufacturing/orders', color: 'bg-emerald-500' },
                { label: 'Facture', icon: FileText, href: '/invoices', color: 'bg-rose-500' },
                { label: 'Client', icon: UserPlus, href: '/sales/customers', color: 'bg-indigo-500' },
                { label: 'Analytics', icon: TrendingUp, href: '/analytics', color: 'bg-indigo-600' },
                { label: 'Stock', icon: BarChart3, href: '/inventory/products-stock', color: 'bg-slate-800' },
                { label: 'Tâches', icon: Calendar, href: '/collaboration/projects', color: 'bg-violet-500' },
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
                        Tableau de Bord
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
                        Recalculer les données
                    </button>
                </div>
            </div>

            {/* --- SECTION 1: APERÇU AUJOURD'HUI (HERO METRICS) --- */}
            <section className="space-y-6">
                <SectionHeader title="Aperçu Aujourd'hui" colorClass="bg-blue-600" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Trésorerie */}
                    <div className="bg-linear-to-br from-slate-900 to-slate-950 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Wallet size={80} />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">💰 Trésorerie en Caisse</div>
                        <div className="text-3xl font-black whitespace-nowrap mb-3" suppressHydrationWarning>
                            {formatCurrency(stats?.financial?.cashFlow || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <span>↗ +15.0% vs hier</span>
                        </div>
                    </div>

                    {/* CA Mensuel */}
                    <div className="bg-linear-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <BarChart3 size={80} />
                        </div>
                        <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">📊 Chiffre d'Affaires Mensuel</div>
                        <div className="text-3xl font-black whitespace-nowrap mb-3" suppressHydrationWarning>
                            {formatCurrency(stats?.overview?.revenue?.current || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-200 font-bold">
                            <span>→ Stable ce mois-ci</span>
                        </div>
                    </div>

                    {/* Objectif CA */}
                    {(() => {
                        const target = 30000;
                        const current = stats?.overview?.revenue?.current || 0;
                        const pct = Math.min(100, Math.round((current / target) * 100));
                        return (
                            <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🎯 Objectif Mensuel ({formatCurrency(target)})</div>
                                <div className="text-3xl font-black text-slate-900 mb-3">{pct}%</div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                        <div 
                                            className="h-full bg-linear-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                        <span>Atteint: {formatCurrency(current)}</span>
                                        <span>Reste: {formatCurrency(Math.max(0, target - current))}</span>
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
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Santé de l'entreprise</h3>
                            <div className="text-xs font-black px-3 py-1.5 bg-slate-900 text-white rounded-full">
                                {stats?.healthData?.score || 80}/100
                            </div>
                        </div>

                        <div className="flex justify-center mb-8">
                            <HealthScoreGauge score={stats?.healthData?.score || 80} />
                        </div>

                        <div className="w-full space-y-3">
                            {[
                                { key: 'cashFlow', label: 'Trésorerie', icon: '💰', desc: 'Flux net de trésorerie' },
                                { key: 'stock', label: 'Stock', icon: '📦', desc: 'Articles en rupture' },
                                { key: 'sales', label: 'Ventes', icon: '📈', desc: 'Chiffre d\'affaires' },
                                { key: 'hr', label: 'Clients', icon: '👥', desc: 'Nouveaux clients' },
                            ].map((factor) => {
                                const metric = stats?.healthData?.metrics?.[factor.key];
                                const status = metric?.status || 'warning';
                                const statusDot = status === 'good' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
                                const statusColor = status === 'good' ? 'border-emerald-100 bg-emerald-50/50' : status === 'warning' ? 'border-amber-100 bg-amber-50/50' : 'border-rose-100 bg-rose-50/50';
                                const textColor = status === 'good' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-rose-700';
                                
                                let displayLabel = metric?.label || factor.desc;
                                let displayPct = metric?.pct || '—';
                                if (factor.key === 'cashFlow') {
                                    displayLabel = `${formatCurrency(stats?.financial?.cashFlow || 0)} en caisse`;
                                    displayPct = '↗ +15.0%';
                                } else if (factor.key === 'stock') {
                                    const count = stats?.production?.stockAlerts || 0;
                                    displayLabel = count > 0 ? `${count} articles en rupture` : 'Niveau optimal';
                                    displayPct = count > 0 ? `⚠️ Action requise` : '100%';
                                } else if (factor.key === 'sales') {
                                    const count = stats?.overview?.sales?.current || 0;
                                    displayLabel = `${count} commande(s) ce mois`;
                                    displayPct = '→ Stable';
                                } else if (factor.key === 'hr') {
                                    const newCust = stats?.healthData?.customers?.new || 0;
                                    const totalCust = stats?.healthData?.customers?.total || 0;
                                    displayLabel = `${newCust} Nouveau${newCust > 1 ? 'x' : ''} | ${totalCust} Total`;
                                    displayPct = '85%';
                                }

                                return (
                                    <div 
                                        key={factor.key} 
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border ${statusColor} transition-all hover:shadow-md cursor-help relative`}
                                        title={metric?.tooltip || ''}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm">{statusDot}</span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{factor.label}</span>
                                                <span className="text-[9px] text-slate-400 font-medium">{displayLabel}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black tracking-wider ${textColor}`}>
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
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[48px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance Commerciale</h3>
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
                                <TrendingUp size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Mois après Mois</span>
                            </div>
                        </div>

                        <div className="h-[320px] w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.sales?.chartData || []} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => [formatCurrency(val as number), 'CA Facturé']}
                                        labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                                        {(stats?.sales?.chartData || []).map((entry: any, index: number) => {
                                            const isLast = index === (stats?.sales?.chartData || []).length - 1;
                                            return <Cell key={`cell-${index}`} fill={isLast ? '#2563eb' : '#3b82f633'} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: ACTIONS RAPIDES --- */}
            <section>
                <SectionHeader title="Actions Rapides" colorClass="bg-blue-600" />
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
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Flux de Production</h3>
                        </div>
                        <Link href="/manufacturing/orders" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 flex-1">
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordres en cours</div>
                            <div className="text-2xl font-black text-slate-900">{stats?.production?.activeOrders || 0}</div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coût Réel</div>
                            <div className="text-xl font-black text-emerald-600 whitespace-nowrap">{formatCurrency(stats?.production?.realCost || 0)}</div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertes Ruptures</div>
                            <div className="text-xl font-black text-rose-500">{stats?.production?.stockAlerts || 0}</div>
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
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Forteresse Financière</h3>
                        </div>
                        <Link href="/treasury/forecast" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Tresorerie Reelle */}
                        <div className="p-5 bg-slate-900 rounded-[24px] text-white">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">💰 Tresorerie Reelle</div>
                            <div className={`text-2xl font-black whitespace-nowrap ${(stats?.financial?.cashFlow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats?.financial?.cashFlow || 0)}</div>
                        </div>
                        {/* CA Facture */}
                        <div className="p-5 bg-blue-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">📊 CA Facture</div>
                            <div className="text-xl font-black text-slate-900 whitespace-nowrap">{formatCurrency(stats?.financial?.invoicedRevenue || 0)}</div>
                        </div>
                        {/* Encaisse with progress bar */}
                        <div className="p-5 bg-emerald-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">✅ Encaisse</div>
                            <div className="text-xl font-black text-slate-900 whitespace-nowrap">{formatCurrency(stats?.financial?.collected || 0)}</div>
                            <div className="mt-3 h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, stats?.financial?.recoveryRate || 0)}%` }} />
                            </div>
                            <div className="text-[10px] font-black text-emerald-600 mt-1.5">{(stats?.financial?.recoveryRate || 0).toFixed(1)}% Taux de recouvrement</div>
                        </div>
                        {/* Profitabilite with trend */}
                        <div className="flex justify-between items-center p-5 bg-slate-50 rounded-[24px]">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📈 Profitabilite</span>
                                <div className="mt-1 h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, stats?.financial?.profitability || 0)}%` }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-slate-900">{(stats?.financial?.profitability || 0).toFixed(1)}%</span>
                                {(stats?.financial?.profitability || 0) >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clients & Ventes */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col h-full hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-12 transition-transform">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Clients & Ventes</h3>
                        </div>
                        <Link href="/sales/customers" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 flex-1">
                        <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-[24px] border border-indigo-100/50">
                            <div>
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Clients Totaux</div>
                                <div className="text-2xl font-black text-slate-900">{stats?.healthData?.customers?.total || 0}</div>
                            </div>
                            <Users size={32} className="text-indigo-200" />
                        </div>
                        <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-[24px] border border-emerald-100">
                            <div>
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Nouveaux ce mois</div>
                                <div className="text-2xl font-black text-slate-900">{stats?.healthData?.customers?.new || 0}</div>
                            </div>
                            <UserPlus size={32} className="text-emerald-200" />
                        </div>
                        {stats?.healthData?.latestCustomer && (
                            <div className="p-5 bg-slate-50 rounded-[24px] flex flex-col justify-between gap-1">
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernier Client</span>
                                    <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest truncate max-w-[120px]" title={stats.healthData.latestCustomer.name}>
                                        {stats.healthData.latestCustomer.name}
                                    </span>
                                </div>
                                {stats.healthData.latestCustomer.orderAmount > 0 && (
                                    <div className="flex justify-between items-center w-full mt-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dernière Commande</span>
                                        <span className="text-xs font-black text-slate-900 whitespace-nowrap">
                                            {formatCurrency(stats.healthData.latestCustomer.orderAmount)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 5: ALERTS & LOGISTICS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Alerts */}
                <section>
                    <SectionHeader title="Alertes Opérationnelles" colorClass="bg-rose-600" />
                    <div className="space-y-4">
                        {/* Low Stock Card */}
                        <div className="p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all group">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                                        ARTICLES EN RUPTURE DE STOCK
                                    </div>
                                    <div className="text-xl font-black text-slate-900 mb-3">
                                        {stats?.production?.stockAlerts || 0} Articles en alerte
                                    </div>
                                    {stats?.production?.lowStockProducts && stats.production.lowStockProducts.length > 0 ? (
                                        <div className="space-y-2 mt-2">
                                            {stats.production.lowStockProducts.slice(0, 3).map((prod: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl">
                                                    <span className="font-bold text-slate-700 truncate max-w-[200px]" title={prod.name}>
                                                        {prod.name}
                                                    </span>
                                                    <span className="font-black text-rose-600 whitespace-nowrap">
                                                        {prod.stockQuantity} / {prod.reorderPoint} unités
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-bold">Tous les stocks sont à un niveau optimal.</p>
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
                                        VALEUR ACHATS EN TRANSIT
                                    </div>
                                    <div className="text-xl font-black text-slate-900 whitespace-nowrap animate-in fade-in duration-300">
                                        {formatCurrency(stats?.procurement?.pendingValue || 0)}
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
                                        COMMANDES CLIENTS ACTIVES
                                    </div>
                                    <div className="text-xl font-black text-slate-900">
                                        {stats?.overview?.sales?.current || 0} Commandes
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Logistics */}
                <section>
                    <SectionHeader title="Flux Logistique Achats" colorClass="bg-amber-600" />
                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 h-full flex flex-col shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Achats en Transit</div>
                                <div className="text-4xl font-black text-slate-900 whitespace-nowrap">{formatCurrency(stats?.procurement?.pendingValue || 0)}</div>
                                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2">{stats?.procurement?.pendingCount || 0} Commandes Ouvertes</div>
                            </div>
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-[24px]">
                                <Truck size={32} />
                            </div>
                        </div>

                        <div className="flex-1 space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Fournisseurs (Volume)</h4>
                            {(stats?.procurement?.topSuppliers || []).length > 0 ? (
                                stats.procurement.topSuppliers.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{s.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 whitespace-nowrap">{formatCurrency(s.value)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Aucune donnée fournisseur</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* --- SECTION 6: TOP ARTICLES & ACTIVITÉ RÉCENTE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Top Articles Vendus */}
                <section>
                    <SectionHeader title="Top Articles Vendus" colorClass="bg-blue-600" />
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
                                            <div className="text-sm font-black text-slate-900 whitespace-nowrap">{formatCurrency(p.revenue)}</div>
                                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{p.quantity} unités</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Aucune donnée de vente</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Activité Récente */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <SectionHeader title="Activité Récente" colorClass="bg-slate-900" />
                        <Link href="/settings/audit" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1">
                            Tout voir <ArrowRight size={12} />
                        </Link>
                    </div>
                    
                    <div className="bg-white border border-slate-100 rounded-[40px] p-6 shadow-sm overflow-hidden h-full flex flex-col justify-between">
                        <div className="divide-y divide-slate-50">
                            {(stats?.recentActivity || []).length > 0 ? (
                                stats.recentActivity.slice(0, 3).map((activity: any, i: number) => (
                                    <div key={i} className="py-4 first:pt-0 last:pb-0 hover:bg-slate-50/50 transition-all flex items-start gap-4 group">
                                        <div className="relative shrink-0">
                                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                <History size={16} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">🕐 {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[80px]" title={activity.user}>{activity.user}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 truncate" title={activity.description}>{activity.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                                    Aucune activité récente détectée
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
