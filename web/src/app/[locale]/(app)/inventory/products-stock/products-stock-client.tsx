'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/formatters';
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
    XCircle
} from 'lucide-react';
import { Link } from '@/navigation';

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
        
        if (filter === 'low') return matchesSearch && Number(item.stockQuantity) <= Number(item.minStock) && Number(item.stockQuantity) > 0;
        if (filter === 'out') return matchesSearch && Number(item.stockQuantity) <= 0;
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{t('stock.title')}</h1>
                    <p className="text-gray-500 font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/inventory/movements"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        {t('movements.title')}
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('stats.total_value')}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-black text-blue-600">{formatCurrency(summary.totalStockValue, locale)}</p>
                            <TrendingDown size={24} className="text-blue-100" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('stats.items_tracked')}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-black text-gray-900">{summary.totalItems}</p>
                            <Layers size={24} className="text-gray-100" />
                        </div>
                    </div>
                    <div className={`p-6 rounded-3xl border shadow-sm ${summary.lowStockAlerts > 0 ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'}`}>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('stats.low_stock')}</p>
                        <div className="flex items-center justify-between">
                            <p className={`text-2xl font-black ${summary.lowStockAlerts > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{summary.lowStockAlerts}</p>
                            <AlertCircle size={24} className={summary.lowStockAlerts > 0 ? 'text-orange-500' : 'text-gray-100'} />
                        </div>
                    </div>
                    <div className={`p-6 rounded-3xl border shadow-sm ${summary.outOfStock > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('stats.out_of_stock')}</p>
                        <div className="flex items-center justify-between">
                            <p className={`text-2xl font-black ${summary.outOfStock > 0 ? 'text-red-600' : 'text-gray-900'}`}>{summary.outOfStock}</p>
                            <XCircle size={24} className={summary.outOfStock > 0 ? 'text-red-500' : 'text-gray-100'} />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={ct('search')}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: t('stock.all_products' as any), icon: Package },
                            { id: 'low', label: t('stock.low_stock'), icon: AlertCircle },
                            { id: 'out', label: t('stock.out_of_stock'), icon: XCircle },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilter(btn.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === btn.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                <btn.icon size={14} />
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.product')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('stock.current')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('stock.min')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.unit_cost')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('stock.value')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('stock.alerts')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredStock.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{item.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-black text-lg text-gray-900">
                                            {Number(item.stockQuantity)}
                                            <span className="text-[10px] ml-1 uppercase text-gray-400 font-medium">{item.unit}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-gray-400">{item.minStock}</span>
                                    </td>
                                    <td className="px-6 py-5 font-medium text-gray-500">
                                        {formatCurrency(Number(item.standardCost), locale)}
                                    </td>
                                    <td className="px-6 py-5 font-black text-blue-600">
                                        {formatCurrency(Number(item.stockValue), locale)}
                                    </td>
                                    <td className="px-6 py-5">
                                        {Number(item.stockQuantity) <= 0 ? (
                                            <span className="text-[9px] font-black px-2 py-1 rounded-md bg-red-100 text-red-700 uppercase tracking-tighter flex items-center gap-1 w-fit">
                                                <XCircle size={10} /> {t('stock.out_of_stock')}
                                            </span>
                                        ) : Number(item.stockQuantity) <= Number(item.minStock) ? (
                                            <span className="text-[9px] font-black px-2 py-1 rounded-md bg-orange-100 text-orange-700 uppercase tracking-tighter flex items-center gap-1 w-fit">
                                                <AlertCircle size={10} /> {t('stock.low_stock')}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-black px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 uppercase tracking-tighter flex items-center gap-1 w-fit">
                                                <CheckCircle2 size={10} /> {t('stock.in_stock')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
