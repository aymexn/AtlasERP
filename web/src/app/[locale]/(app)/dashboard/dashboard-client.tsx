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
    Bell
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

    useEffect(() => {
        setIsMounted(true);
        const loadDashboard = async () => {
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
                    health: kpisRes.data?.health || { score: 85, factors: {} }
                });
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
                { label: 'Vente', icon: Plus, href: '/sales/orders/new', color: 'bg-blue-500' },
                { label: 'Achat', icon: ShoppingCart, href: '/purchases/orders/new', color: 'bg-amber-500' },
                { label: 'Fabrication', icon: Factory, href: '/manufacturing/orders/new', color: 'bg-emerald-500' },
                { label: 'Facture', icon: FileText, href: '/invoices/new', color: 'bg-rose-500' },
                { label: 'Client', icon: UserPlus, href: '/customers/new', color: 'bg-indigo-500' },
                { label: 'Rapport', icon: BarChart3, href: '/analytics', color: 'bg-slate-600' },
                { label: 'Stock', icon: Search, href: '/inventory', color: 'bg-slate-800' },
                { label: 'Analytics', icon: TrendingUp, href: '/analytics/sales', color: 'bg-indigo-600' },
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
                    <div className="relative group cursor-pointer p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-all">
                        <Bell size={20} className="text-slate-500" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <button 
                            onClick={async () => {
                                setLoading(true);
                                await dashboardService.refreshKpis();
                                window.location.reload();
                            }}
                            className="hover:rotate-180 transition-transform duration-500 p-1"
                        >
                            <Badge variant="active" className="px-4 py-2 text-[10px] font-black tracking-widest cursor-pointer">
                                🔄 REFRESH
                            </Badge>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SECTION 1: HERO COMMAND CENTER --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Business Health Score */}
                <div className="lg:col-span-4 bg-white border-2 border-slate-50 rounded-[48px] p-10 flex flex-col items-center justify-center shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={140} />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Santé de l'entreprise</h3>
                    <HealthScoreGauge score={stats?.health?.score || 85} />
                    
                    <div className="grid grid-cols-2 gap-4 w-full mt-10">
                        {[
                            { label: 'Trésorerie', status: stats?.financial?.cashFlow >= 0 ? 'healthy' : 'attention', icon: '💰' },
                            { label: 'Stock', status: stats?.production?.stockAlerts === 0 ? 'healthy' : 'attention', icon: '📦' },
                            { label: 'Ventes', status: stats?.overview?.sales?.variance >= 0 ? 'growing' : 'attention', icon: '📈' },
                            { label: 'RH', status: stats?.hr?.activeEmployees > 0 ? 'stable' : 'attention', icon: '👥' },
                        ].map((factor) => (
                            <div key={factor.label} className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs">{factor.status === 'healthy' || factor.status === 'growing' || factor.status === 'good' || factor.status === 'stable' ? '🟢' : '🟡'}</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{factor.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Today's Performance */}
                <div className="lg:col-span-8 bg-slate-900 rounded-[48px] p-12 text-white flex flex-col justify-between shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <TrendingUp size={180} />
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance du jour</h3>
                            <div className="flex items-center gap-3 bg-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-full border border-emerald-500/30">
                                <TrendingUp size={16} />
                                <span className="text-[10px] font-black tracking-widest uppercase">{stats?.overview?.revenue?.variance >= 0 ? '+' : ''}{stats?.overview?.revenue?.variance}% vs MOIS DERNIER</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chiffre d'affaires Mensuel</div>
                                    <div className="text-6xl font-black tracking-tight" suppressHydrationWarning>
                                        {formatCurrency(stats?.overview?.revenue?.current || 0)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-5 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/30"
                                    style={{ width: `${Math.min(100, (stats?.overview?.revenue?.current / Math.max(1, stats?.overview?.revenue?.previous || 100000)) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                                <div className="flex gap-4">
                                    <span className="text-emerald-400">Progression vs mois dernier: {stats?.overview?.revenue?.variance}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-12 mt-16 border-t border-white/5 pt-10">
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ventes (Mois)</div>
                            <div className="text-3xl font-black">{stats?.overview?.sales?.current || 0}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Panier Moyen</div>
                            <div className="text-3xl font-black">{formatCurrency(stats?.overview?.averageBasket?.current || 0)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nouveaux Clients</div>
                            <div className="text-3xl font-black text-emerald-400">+{stats?.overview?.newCustomers?.current || 0}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: TOP 4 KPIs --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <DollarSign size={20} />
                        </div>
                        <div className={`flex items-center gap-1 font-black text-[10px] ${stats?.overview?.revenue?.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stats?.overview?.revenue?.variance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 
                            {Math.abs(stats?.overview?.revenue?.variance || 0)}%
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">REVENUS (MOIS)</div>
                    <div className="text-2xl font-black text-slate-900">{formatCurrency(stats?.overview?.revenue?.current || 0)}</div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <ShoppingCart size={20} />
                        </div>
                        <div className={`flex items-center gap-1 font-black text-[10px] ${stats?.overview?.sales?.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stats?.overview?.sales?.variance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(stats?.overview?.sales?.variance || 0)}%
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">COMMANDES (MOIS)</div>
                    <div className="text-2xl font-black text-slate-900">{stats?.overview?.sales?.current || 0}</div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Users size={20} />
                        </div>
                        <div className={`flex items-center gap-1 font-black text-[10px] ${stats?.overview?.newCustomers?.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stats?.overview?.newCustomers?.variance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(stats?.overview?.newCustomers?.variance || 0)}%
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NOUVEAUX CLIENTS</div>
                    <div className="text-2xl font-black text-slate-900">{stats?.overview?.newCustomers?.current || 0}</div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            <AlertTriangle size={20} />
                        </div>
                        {stats?.production?.stockAlerts > 0 && (
                            <div className="bg-rose-500 text-white px-2 py-0.5 rounded-full font-black text-[8px] tracking-widest animate-pulse">
                                URGENT
                            </div>
                        )}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">STOCK CRITIQUE</div>
                    <div className="text-2xl font-black text-slate-900">{stats?.production?.stockAlerts || 0}</div>
                </div>
            </div>

            {/* --- SECTION 3: QUICK ACTIONS --- */}
            <section>
                <SectionHeader title="Actions Rapides" colorClass="bg-blue-600" />
                <QuickActions />
            </section>

            {/* --- SECTION 4: OPERATIONAL BLOCKS --- */}
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
                            <div className="text-xl font-black text-emerald-600">{formatCurrency(stats?.production?.realCost || 0)}</div>
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
                        <Link href="/finance/treasury" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-5 bg-slate-900 rounded-[24px] text-white col-span-2">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Trésorerie Réelle</div>
                            <div className="text-2xl font-black">{formatCurrency(stats?.financial?.cashFlow || 0)}</div>
                        </div>
                        <div className="p-5 bg-blue-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">CA Facturé</div>
                            <div className="text-lg font-black text-slate-900">{formatCurrency(stats?.financial?.invoicedRevenue || 0)}</div>
                        </div>
                        <div className="p-5 bg-emerald-50 rounded-[24px]">
                            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Encaissé</div>
                            <div className="text-lg font-black text-slate-900">{formatCurrency(stats?.financial?.collected || 0)}</div>
                            <div className="text-[8px] font-black text-emerald-600 mt-1">{stats?.financial?.recoveryRate?.toFixed(1)}% RECOUV.</div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-5 bg-slate-50 rounded-[24px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profitabilité</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900">{stats?.financial?.profitability?.toFixed(1) || '0.0'}%</span>
                            {stats?.financial?.profitability >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                        </div>
                    </div>
                </div>

                {/* HR Overview */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col h-full hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-12 transition-transform">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Ressources Humaines</h3>
                        </div>
                        <Link href="/hr" className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 flex-1">
                        <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-[24px] border border-indigo-100/50">
                            <div>
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Employés Actifs</div>
                                <div className="text-2xl font-black text-slate-900">{stats?.hr?.activeEmployees || 0}</div>
                            </div>
                            <Users size={32} className="text-indigo-200" />
                        </div>
                        <div className="flex items-center justify-between p-5 bg-amber-50 rounded-[24px] border border-amber-100">
                            <div>
                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Congés en attente</div>
                                <div className="text-2xl font-black text-slate-900">{stats?.hr?.pendingLeaves || 0}</div>
                            </div>
                            <Clock size={32} className="text-amber-200" />
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[24px] flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recrutement Actif</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{stats?.hr?.activeRecruitments || 0} Postes</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 5: ALERTS & LOGISTICS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Alerts */}
                <section>
                    <SectionHeader title="Alertes Opérationnelles" colorClass="bg-rose-600" />
                    <div className="space-y-4">
                        {[
                            { title: 'ARTICLES EN RUPTURE DE STOCK', value: `${stats?.production?.stockAlerts || 0} Articles`, severity: 'rose', icon: AlertTriangle },
                            { title: 'VALEUR ACHATS EN TRANSIT', value: formatCurrency(stats?.procurement?.pendingValue || 0), severity: 'amber', icon: Truck },
                            { title: 'COMMANDES ACTIVES', value: `${stats?.kpis?.totalOrders || 0} Commandes`, severity: 'blue', icon: ShoppingCart },
                        ].map((alert, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all group cursor-pointer">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 bg-${alert.severity}-50 text-${alert.severity}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                                        <alert.icon size={24} />
                                    </div>
                                    <div>
                                        <div className={`text-[10px] font-black text-${alert.severity}-500 uppercase tracking-widest mb-1`}>{alert.title}</div>
                                        <div className="text-xl font-black text-slate-900">{alert.value}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Logistics */}
                <section>
                    <SectionHeader title="Flux Logistique Achats" colorClass="bg-amber-600" />
                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 h-full flex flex-col shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Achats en Transit</div>
                                <div className="text-4xl font-black text-slate-900">{formatCurrency(stats?.procurement?.pendingValue || 0)}</div>
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
                                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">{formatCurrency(s.value)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Aucune donnée fournisseur</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* --- SECTION 6: PERFORMANCE COMMERCIALE --- */}
            <section>
                <SectionHeader title="Performance Commerciale" colorClass="bg-blue-600" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 h-full flex flex-col shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Mensuel</div>
                                <div className="text-4xl font-black text-slate-900">{formatCurrency(stats?.sales?.monthlyRevenue || 0)}</div>
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2">{stats?.sales?.activeOrders || 0} Ordres actifs</div>
                            </div>
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-[24px]">
                                <BarChart3 size={32} />
                            </div>
                        </div>
                        <div className="h-[250px] w-full mb-8">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.sales?.chartData || []}>
                                    <XAxis dataKey="date" hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => formatCurrency(val as number)}
                                    />
                                    <Bar dataKey="revenue" radius={[12, 12, 0, 0]}>
                                        {(stats?.sales?.chartData || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === (stats?.sales?.chartData || []).length - 1 ? '#3b82f6' : '#f1f5f9'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 h-full flex flex-col shadow-sm">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Top Ventes Articles</h4>
                         <div className="space-y-4 flex-1">
                             {(stats?.sales?.topSellingProducts || []).length > 0 ? (
                                stats.sales.topSellingProducts.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] hover:scale-[1.02] transition-transform">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg">
                                                📦
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">{p.name}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[150px]">SKU: {p.id.substring(0, 8)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900">{formatCurrency(p.revenue)}</div>
                                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{p.quantity} unités</div>
                                        </div>
                                    </div>
                                ))
                             ) : (
                                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Aucune donnée de vente</div>
                             )}
                         </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 7: ACTIVITY FEED --- */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <SectionHeader title="Activité Récente" colorClass="bg-slate-900" />
                    <Link href="/audit-logs" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1">
                        Tout voir <ArrowRight size={12} />
                    </Link>
                </div>
                
                <div className="bg-white border border-slate-100 rounded-[48px] p-4 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {(stats?.recentActivity || []).length > 0 ? (
                            stats.recentActivity.map((activity: any, i: number) => (
                                <div key={i} className="p-8 hover:bg-slate-50 transition-all flex items-start gap-6 group">
                                    <div className="relative">
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            <History size={22} />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🕐 {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{activity.user}</span>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900">{activity.description}</p>
                                        <div className="mt-2 flex items-center gap-4">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {activity.id.substring(0, 8)}</span>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">• Terminée</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-24 text-center text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                                Aucune activité récente détectée
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
