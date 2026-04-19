'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { 
    ClipboardList, 
    PackageSearch, 
    History,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Package,
    Activity,
    Box,
    Loader2,
    CheckCircle2,
    Plus,
    ArrowRight,
    ArrowRightLeft,
    Layers,
    Coins
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { inventoryService, InventorySummary } from '@/services/inventory';

import { formatCurrency, formatNumber } from '@/lib/format';
import { toast } from 'sonner';
import { KpiCard } from '@/components/ui/kpi-card';

export default function InventoryRootPage() {
    const t = useTranslations('inventory');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [stats, setStats] = useState<InventorySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [summary, lowStock] = await Promise.all([
                    inventoryService.getProductsStockDashboard(),
                    inventoryService.getLowStockAlerts()
                ]);
                setStats(summary);
                setAlerts(lowStock);
            } catch (err) {
                console.error('Failed to load inventory dashboard', err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-primary text-white rounded-4xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <Box size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            {t('title')}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">
                            {t('subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Links / Main Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 transition-all relative overflow-hidden flex flex-col justify-between">
                    <div className="p-10 space-y-2">
                        <div className="h-14 w-14 bg-slate-50 rounded-3xl flex items-center justify-center text-primary shadow-sm mb-6 border border-slate-100 transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:rotate-6 duration-500">
                            <Package size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('stock_status')}</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">{t('stock_status_desc')}</p>
                        <div className="pt-6">
                            <Link 
                                href="/inventory/products-stock" 
                                className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group/link"
                            >
                                {ct('consult')}
                                <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 transition-all relative overflow-hidden flex flex-col justify-between">
                    <div className="p-10 space-y-2">
                        <div className="h-14 w-14 bg-slate-50 rounded-3xl flex items-center justify-center text-primary shadow-sm mb-6 border border-slate-100 transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:-rotate-6 duration-500">
                            <TrendingDown size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('movements.title')}</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">{t('movements_desc')}</p>
                        <div className="pt-6">
                            <Link 
                                href="/inventory/movements" 
                                className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group/link"
                            >
                                {ct('consult')}
                                <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="group bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 p-10 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="h-20 w-20 bg-white rounded-4xl flex items-center justify-center text-slate-200 shadow-sm">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('analytics_overview')}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{t('analytics_coming_soon')}</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <KpiCard 
                    title={t('stats.total_value')} 
                    value={stats?.totalStockValue || 0} 
                    icon={Coins} 
                    variant="primary" 
                    type="currency" 
                />
                <KpiCard 
                    title={t('stats.items_tracked')} 
                    value={stats?.totalItems || 0} 
                    icon={Layers} 
                    variant="secondary" 
                    type="count" 
                />
                <KpiCard 
                    title={t('stats.low_stock')} 
                    value={stats?.lowStockAlerts || 0} 
                    icon={AlertCircle} 
                    variant="warning" 
                    type="count" 
                />
                <KpiCard 
                    title={t('stats.out_of_stock')} 
                    value={stats?.outOfStock || 0} 
                    icon={Box} 
                    variant="danger" 
                    type="count" 
                />
            </div>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('stock.alerts')}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Actions prioritaires requises</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse border border-rose-100">
                            <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex-1 p-10">
                        {alerts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {alerts.slice(0, 4).map((alert: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-primary transition-all duration-500">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                                                <Package size={24} className="text-primary/40" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-slate-900 text-lg tracking-tight leading-none">{alert.name}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{alert.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-rose-600 tracking-tighter">{alert.stockQuantity} <span className="text-[10px] uppercase opacity-50">{alert.unit}</span></p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Min: {alert.minStock}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="h-24 w-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center">
                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('all_clear')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
