'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { inventoryService, InventorySummary } from '@/services/inventory';
import {
    AlertCircle,
    Package,
    TrendingDown,
    Layers,
    Search,
    Filter,
    ArrowRight,
    Loader2,
    CheckCircle2,
    XCircle,
    FileText,
    Download
} from 'lucide-react';
import { downloadPdf } from '@/lib/download-pdf';
import { Link } from '@/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

export default function ProductsStockClient() {
    const t = useTranslations('inventory');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [stock, setStock] = useState<any[]>([]);
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [stockData, summaryData] = await Promise.all([
                inventoryService.getStock(),
                inventoryService.getProductsStockDashboard()
            ]);
            setStock(stockData || []);
            setSummary(summaryData);
        } catch (err) {
            console.error('Failed to load stock summary', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStock = stock.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'low') return matchesSearch && Number(item.stockQuantity) < Number(item.minStock) && Number(item.stockQuantity) > 0;
        if (filter === 'out') return matchesSearch && Number(item.stockQuantity) <= 0;
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            <PageHeader 
                title={t('stock.title')}
                subtitle={t('subtitle')}
                icon={Package}
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <KpiCard 
                    title={t('stats.total_value')} 
                    value={summary?.totalStockValue || 0} 
                    icon={TrendingDown} 
                    variant="primary" 
                    type="currency" 
                />
                <KpiCard 
                    title={t('stats.items_tracked')} 
                    value={summary?.totalItems || 0} 
                    icon={Layers} 
                    variant="slate" 
                    type="count" 
                />
                <KpiCard 
                    title={t('stats.low_stock')} 
                    value={summary?.lowStockAlerts || 0} 
                    icon={AlertCircle} 
                    variant="warning" 
                    type="count" 
                />
                <KpiCard 
                    title={t('stats.out_of_stock')} 
                    value={summary?.outOfStock || 0} 
                    icon={XCircle} 
                    variant="danger" 
                    type="count" 
                />
            </div>

            {/* Main Content Area */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-4xl overflow-hidden bg-white">
                <CardHeader className="p-10 border-b border-slate-50 flex flex-wrap items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="relative w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={ct('search')}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold h-[56px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                            {[
                                { id: 'all', label: t('stock.all_products'), icon: Package },
                                { id: 'low', label: t('stock.low_stock'), icon: AlertCircle },
                                { id: 'out', label: t('stock.out_of_stock'), icon: XCircle },
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => setFilter(btn.id as any)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        filter === btn.id 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <btn.icon size={14} strokeWidth={2.5} />
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => downloadPdf('/api/pdf/inventory', `Inventaire_${new Date().toISOString().slice(0,10)}.pdf`)}
                        className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                        <FileText size={16} />
                        Exporter l'Inventaire (PDF)
                    </button>
                </CardHeader>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">{t('movements.fields.product')}</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-center">{t('stock.current')}</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-center">{t('stock.min')}</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-right">{t('stock.value')}</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-right">{t('stock.alerts')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredStock.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-slate-900 text-base tracking-tight group-hover:text-primary transition-colors">{item.name}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <span className="font-black text-xl text-slate-900 tracking-tighter">
                                            {Number(item.stockQuantity)}
                                            <span className="text-[10px] ml-1.5 uppercase text-slate-400 font-black tracking-normal">{item.unit}</span>
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <span className="font-black text-slate-400 border border-slate-100 px-3 py-1 rounded-lg text-xs bg-slate-50/50">{item.minStock}</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            {(() => {
                                                const cost = Number(item.purchasePriceHt || item.standardCost || 0);
                                                const value = Number(item.stockQuantity) * cost;
                                                return (
                                                    <>
                                                        <span className="font-black text-primary text-base">
                                                            {formatCurrency(value)}
                                                        </span>
                                                        {cost === 0 ? (
                                                            <span className="text-[9px] font-black text-red-500 uppercase mt-1 px-2 py-0.5 bg-red-50 rounded-lg border border-red-100 flex items-center gap-1">
                                                                <AlertCircle size={10} />
                                                                Coût non défini
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider opacity-60">
                                                                {t('movements.fields.unit_cost')}: {formatCurrency(cost)}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex justify-end">
                                            {Number(item.stockQuantity) <= 0 ? (
                                                <Badge variant="danger" className="animate-pulse">
                                                    {t('stock.out_of_stock')}
                                                </Badge>
                                            ) : Number(item.stockQuantity) < Number(item.minStock) ? (
                                                <Badge variant="warning">
                                                    {t('stock.low_stock')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="active">
                                                    {t('stock.in_stock')}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
