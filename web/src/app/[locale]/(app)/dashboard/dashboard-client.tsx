'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { formatCurrency } from '@/lib/formatters';
import { 
    Factory, AlertTriangle, CheckCircle2, ListFilter, 
    ArrowUpRight, ArrowDownRight, Activity, Layers, Package, ShoppingCart,
    TrendingUp, ArrowRight, User, Sparkles, Wallet, Landmark, PiggyBank,
    ReceiptText, Building2
} from 'lucide-react';

export function DashboardClient() {
    const t = useTranslations('dashboard');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [tenant, setTenant] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('atlas_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const loadData = async () => {
            try {
                const [tenantData, productionStats] = await Promise.all([
                    apiFetch('/tenants/me'),
                    apiFetch('/dashboard/production-stats')
                ]);

                if (!tenantData) {
                    router.push('/tenant');
                } else {
                    setTenant(tenantData);
                    setStats(productionStats);
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('[Dashboard] Failed to load data:', err);
            }
        };

        loadData();
    }, [router, locale]);

    const handleLogout = () => {
        localStorage.removeItem('atlas_token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-600 rounded-full mb-4 shadow-xl"></div>
                    <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">{ct('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-blue-50">
                        {ct('title').charAt(0)}
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter">{ct('title')}<span className="text-blue-600">ERP</span></h1>
                </div>
                <div className="flex items-center gap-6">
                    <LanguageSwitcher />
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{ct('active_tenant')}</p>
                        <p className="text-sm font-bold text-gray-900 leading-none mt-1">{tenant?.name || 'Default'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg hover:shadow-red-200/50 active:scale-95"
                    >
                        {ct('logout')}
                    </button>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto space-y-12">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter lg:text-5xl">{t('title')}</h2>
                        <div className="flex items-center gap-2 text-gray-400">
                             <Building2 size={14} className="text-blue-500" />
                             <p className="font-black uppercase text-[10px] tracking-[0.2em]">{tenant?.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/manufacturing/orders" className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95">
                           <Factory size={18} /> {t('go_to_production')}
                        </Link>
                    </div>
                </header>

                {/* Primary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: t('active_orders'), value: stats?.orders?.active || 0, icon: Activity, color: 'blue' },
                        { label: t('produced_goods'), value: stats?.inventory?.producedCount || 0, icon: CheckCircle2, color: 'emerald' },
                        { label: t('actual_cost'), value: formatCurrency(stats?.costs?.actual || 0, locale), icon: Layers, color: 'indigo' },
                        { label: t('shortage_alerts'), value: stats?.inventory?.shortageCount || 0, icon: AlertTriangle, color: 'rose' }
                    ].map((item) => (
                        <div key={item.label} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:border-blue-100 group relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                            <div className={`absolute top-0 right-0 h-24 w-24 bg-${item.color}-500/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-all`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-black text-gray-400 uppercase text-[9px] tracking-[0.2em]">{item.label}</h3>
                                <div className={`p-2 bg-${item.color}-50 text-${item.color}-600 rounded-xl`}>
                                    <item.icon size={18} />
                                </div>
                            </div>
                            <p className="text-3xl font-black text-gray-950 tracking-tighter leading-none mb-1 truncate">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Procurement Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-2xl transition-all overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700"></div>
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="h-20 w-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner">
                                <ShoppingCart size={40} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{t('purchases_in_transit')}</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tighter">{formatCurrency(stats?.procurement?.pendingValue || 0, locale)}</p>
                                <div className="text-[10px] font-black text-amber-600 mt-3 flex items-center gap-3 uppercase tracking-widest bg-amber-50 w-fit px-3 py-1 rounded-full border border-amber-100">
                                    <div className="h-1.5 w-1.5 bg-amber-600 rounded-full animate-pulse"></div>
                                    {t('pending_bc', { count: stats?.procurement?.pendingCount || 0 })}
                                </div>
                            </div>
                        </div>
                        <Link href="/purchases/orders" className="h-14 w-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all relative z-10 shadow-sm hover:rotate-12">
                            <ArrowUpRight size={24} />
                        </Link>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all overflow-hidden relative min-h-[220px]">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700"></div>
                        <div className="flex items-center gap-8 relative z-10 mb-6">
                            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                                <Package size={40} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">{t('top_suppliers')}</p>
                                <div className="space-y-3">
                                    {(stats?.procurement?.topSuppliers || []).slice(0, 3).map((s: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px] font-black">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="h-6 w-6 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-gray-600 truncate uppercase tracking-tight">{s.name}</span>
                                            </div>
                                            <span className="text-gray-900 ml-4 font-mono">{formatCurrency(s.value, locale)}</span>
                                        </div>
                                    ))}
                                    {(!stats?.procurement?.topSuppliers || stats?.procurement?.topSuppliers.length === 0) && (
                                        <p className="text-[10px] text-gray-300 italic font-medium uppercase tracking-widest">{t('no_suppliers')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('raw_material_stock')}:</span>
                                <p className="text-lg font-black text-blue-600 tracking-tighter">{formatCurrency(stats?.procurement?.rawMaterialValue || 0, locale)}</p>
                            </div>
                            <Link href="/purchases/suppliers" className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                                Voir tout
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Financial Fortress Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 transition-all hover:shadow-2xl">
                        <div className="absolute top-0 left-0 h-full w-2 bg-blue-600"></div>
                        <div className="flex items-center gap-8 min-w-0">
                            <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-inner flex-shrink-0">
                                <Landmark size={48} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">{t('cash_flow')}</p>
                                <h3 className={`text-5xl font-black tracking-tighter truncate ${stats?.finances?.cashPosition >= 0 ? 'text-gray-950' : 'text-rose-600'}`}>
                                    {formatCurrency(stats?.finances?.cashPosition || 0, locale)}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 mt-6">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase border border-emerald-100">
                                        <Wallet size={14} />
                                        {t('receipts')}: {formatCurrency(stats?.finances?.receipts || 0, locale)}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-2xl text-[10px] font-black uppercase border border-rose-100">
                                        <ReceiptText size={14} />
                                        {t('total_expenses')}: {formatCurrency(stats?.finances?.totalExpenses || 0, locale)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link href="/finances/expenses" className="flex items-center gap-4 bg-gray-900 text-white px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all active:scale-95 group shrink-0">
                            {t('go_to_finances')}
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-10 shadow-2xl shadow-emerald-100 relative overflow-hidden transition-all hover:scale-[1.02] group">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full translate-x-12 -translate-y-12 group-hover:scale-125 transition-transform duration-1000"></div>
                        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                            {t('net_profit')}
                        </p>
                        <div className="flex flex-col">
                            <h3 className="text-5xl font-black text-white tracking-tighter mb-3 truncate">
                                {formatCurrency(stats?.finances?.netProfit || 0, locale)}
                            </h3>
                            <div className="flex items-center gap-3 text-emerald-100 font-black uppercase text-[10px] tracking-widest opacity-80">
                                <PiggyBank size={18} className="text-emerald-300" />
                                {t('profit_desc')}
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/20 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[8px] font-black text-emerald-200/60 uppercase tracking-widest mb-1">{t('revenue_ht')}</p>
                                <p className="text-xs font-black text-white truncate">{formatCurrency(stats?.finances?.totalRevenue || 0, locale)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-emerald-200/60 uppercase tracking-widest mb-1">{t('cogs')}</p>
                                <p className="text-xs font-black text-white truncate">{formatCurrency(stats?.finances?.totalCogs || 0, locale)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Snapshot */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-center gap-10 min-w-0">
                        <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-inner flex-shrink-0">
                            <TrendingUp size={48} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">{t('monthly_revenue')}</p>
                            <h3 className="text-5xl font-black text-gray-950 tracking-tighter truncate">
                                {formatCurrency(stats?.sales?.monthlyRevenue || 0, locale)}
                                <span className="text-base font-black text-gray-400 ml-4 tracking-normal">HT</span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase border border-blue-100">
                                    <ShoppingCart size={14} />
                                    {t('active_sales', { count: stats?.sales?.activeOrders || 0 })}
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase border border-emerald-100">
                                    <User size={14} />
                                    {t('active_customers', { count: stats?.sales?.customerCount || 0 })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Link href="/sales/orders" className="flex items-center gap-4 bg-gray-900 text-white px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 group shrink-0">
                        {t('go_to_sales')}
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Production Detail */}
                    <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-gray-950 tracking-tight flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                                    <Layers size={24} />
                                </div>
                                {t('production_overview')}
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50/50 rounded-[2.5rem] p-10 border border-gray-100 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{t('estimated_cost')}</p>
                                <p className="text-4xl font-black text-gray-950 tracking-tighter truncate">{formatCurrency(stats?.costs?.estimated || 0, locale)}</p>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{t('variance')}</p>
                                <div className="flex items-center justify-between">
                                    <p className={`text-4xl font-black tracking-tighter truncate ${stats?.costs?.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(stats?.costs?.variance || 0, locale)}
                                    </p>
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${stats?.costs?.variance > 0 ? 'bg-rose-50 text-rose-600 shadow-rose-100' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'}`}>
                                        {stats?.costs?.variance > 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Products */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm transition-all hover:shadow-xl h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-gray-950 tracking-tight flex items-center gap-4">
                                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                                    <Sparkles size={24} />
                                </div>
                                {t('top_selling')}
                            </h3>
                        </div>
                        
                        <div className="space-y-8 flex-1">
                            {stats?.sales?.topSellingProducts?.length > 0 ? (
                                stats.sales.topSellingProducts.slice(0, 5).map((p: any, idx: number) => (
                                    <div key={idx} className="space-y-3 group cursor-default">
                                        <div className="flex justify-between items-end gap-4 min-w-0">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">{p.name}</p>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60">{p.quantity} units sold</p>
                                            </div>
                                            <p className="text-xs font-black text-gray-950 font-mono flex-shrink-0">{formatCurrency(p.revenue, locale)}</p>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 group-hover:bg-emerald-400"
                                                style={{ width: `${(p.revenue / (stats.sales.topSellingProducts[0].revenue || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 py-12">
                                    <div className="h-20 w-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
                                        <TrendingUp size={40} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('no_sales_data')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
