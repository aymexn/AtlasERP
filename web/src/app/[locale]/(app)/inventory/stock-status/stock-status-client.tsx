'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    AlertCircle,
    Package,
    TrendingDown,
    Layers,
    Search,
    Loader2,
    XCircle,
    FileText,
    TrendingUp,
    Box
} from 'lucide-react';
import { downloadPdf } from '@/lib/download-pdf';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatStock } from '@/lib/format';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function StockStatusClient() {
    const t = useTranslations('inventory');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Query parameters states
    const activeFilter = searchParams.get('filter') || 'all';
    const activeSearch = searchParams.get('q') || '';

    const [stock, setStock] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStock, setLoadingStock] = useState(false);
    const [searchTerm, setSearchTerm] = useState(activeSearch);

    // Load initial KPIs and Stock list
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [kpiData, stockData] = await Promise.all([
                    apiFetch('/api/inventory/kpis'),
                    apiFetch(`/api/inventory/stock-status?filter=${activeFilter}`)
                ]);
                setKpis(kpiData);
                setStock(stockData?.data || []);
            } catch (err) {
                console.error('Failed to load stock data', err);
                toast.error('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Fetch stock again when filter query param changes
    useEffect(() => {
        const loadFilteredStock = async () => {
            setLoadingStock(true);
            try {
                const stockData = await apiFetch(`/api/inventory/stock-status?filter=${activeFilter}`);
                setStock(stockData?.data || []);
            } catch (err) {
                console.error('Failed to filter stock data', err);
            } finally {
                setLoadingStock(false);
            }
        };
        // Avoid initial duplicate call
        if (!loading) {
            loadFilteredStock();
        }
    }, [activeFilter]);

    // Handle filter update and sync URL
    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('filter', newFilter);
        router.push(`${pathname}?${params.toString()}`);
    };

    // Update search param in URL
    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        const params = new URLSearchParams(searchParams.toString());
        if (val) {
            params.set('q', val);
        } else {
            params.delete('q');
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    // Handle PDF Export
    const handlePdfExport = async () => {
        try {
            const filename = `Etat_Stocks_${activeFilter}_${new Date().toISOString().slice(0, 10)}.pdf`;
            const pdfUrl = `/api/inventory/stock-status/pdf?filter=${activeFilter}`;
            toast.info('Génération du PDF...');
            await downloadPdf(pdfUrl, filename);
            toast.success('PDF téléchargé avec succès');
        } catch (err) {
            console.error('Failed to export PDF', err);
            toast.error('Erreur lors de la génération du PDF');
        }
    };

    // Client-side search filtering
    const filteredStock = stock.filter(item => {
        const term = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term);
    });

    // Sum up the calculated frontend total value only for displayed matching rows
    const displayTotalStockValue = filteredStock.reduce((sum, item) => {
        return sum + (item.costPrice > 0 ? Number(item.stockValue || 0) : 0);
    }, 0);

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
                    value={kpis?.totalStockValue || 0} 
                    icon={TrendingDown} 
                    variant="primary" 
                    type="currency" 
                />
                <KpiCard 
                    title={t('stats.items_tracked')} 
                    value={kpis?.trackedProducts || 0} 
                    icon={Layers} 
                    variant="slate" 
                    type="count" 
                />
                <KpiCard 
                    title={t('stats.low_stock')} 
                    value={kpis?.alertCount || 0} 
                    icon={AlertCircle} 
                    variant="warning" 
                    type="count" 
                />
                <KpiCard 
                    title={t('stats.out_of_stock')} 
                    value={kpis?.outOfStockCount || 0} 
                    icon={XCircle} 
                    variant="danger" 
                    type="count" 
                />
            </div>

            {/* Main Content Card */}
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
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                            {[
                                { id: 'all', label: t('stock.all_products'), icon: Package },
                                { id: 'low_stock', label: t('stock.low_stock'), icon: AlertCircle },
                                { id: 'out_of_stock', label: t('stock.out_of_stock'), icon: XCircle },
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleFilterChange(btn.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        activeFilter === btn.id 
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
                        onClick={handlePdfExport}
                        className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                        <FileText size={16} />
                        {t('stock.export_pdf')}
                    </button>
                </CardHeader>

                <div className="overflow-x-auto relative">
                    {loadingStock && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                                    {t('movements.fields.product')}
                                </th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 min-w-[120px] text-right">
                                    {t('stock.current')}
                                </th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 min-w-[120px] text-right">
                                    {t('stock.min')}
                                </th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 min-w-[160px] text-right">
                                    {t('stock.value')}
                                </th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-right">
                                    {t('stock.alerts')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredStock.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-slate-400 font-bold">
                                        Aucun produit trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredStock.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-slate-900 text-base tracking-tight group-hover:text-primary transition-colors">
                                                    {item.name}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    {item.sku}
                                                </span>
                                                {item.family && (
                                                    <span className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                                                        {item.family.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right whitespace-nowrap font-mono tabular-nums">
                                            <span className="font-black text-xl text-slate-900 tracking-tighter">
                                                {formatStock(item.stockQuantity)}
                                            </span>
                                            <span className="text-[10px] ml-1.5 uppercase text-slate-400 font-black tracking-normal">
                                                {item.unit}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right whitespace-nowrap font-mono tabular-nums">
                                            {item.reorderPoint > 0 ? (
                                                <>
                                                    <span className="font-black text-slate-500">
                                                        {formatStock(item.reorderPoint)}
                                                    </span>
                                                    <span className="text-[10px] ml-1.5 uppercase text-slate-400 font-black tracking-normal">
                                                        {item.unit}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-slate-300 font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6 text-right whitespace-nowrap font-mono tabular-nums">
                                            <div className="flex flex-col items-end">
                                                {item.costPrice > 0 ? (
                                                    <>
                                                        <span className="font-black text-primary text-base">
                                                            {formatCurrency(item.stockValue)}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider opacity-60">
                                                            {t('movements.fields.unit_cost')}: {formatCurrency(item.costPrice)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-black text-slate-300 text-base">—</span>
                                                        <span className="text-[9px] font-black text-rose-500 uppercase mt-1 px-2 py-0.5 bg-red-50 rounded-lg border border-red-100 flex items-center gap-1">
                                                            <AlertCircle size={10} />
                                                            COÛT NON DÉFINI
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right whitespace-nowrap">
                                            <div className="flex justify-end">
                                                {item.status === 'OUT' ? (
                                                    <Badge variant="danger" className="animate-pulse">
                                                        {t('stock.out_of_stock')}
                                                    </Badge>
                                                ) : item.status === 'LOW' ? (
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Total Summary Row */}
                {filteredStock.length > 0 && (
                    <div className="bg-slate-50 border-t border-slate-100 p-8 flex flex-wrap justify-between items-center gap-4">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Total Affiché : {filteredStock.length} référence(s)
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                                Valeur Totale :
                            </span>
                            <span className="text-2xl font-black text-primary font-mono whitespace-nowrap tabular-nums">
                                {formatCurrency(displayTotalStockValue)}
                            </span>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
