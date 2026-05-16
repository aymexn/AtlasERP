'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Factory, Plus, Search, Filter, AlertCircle, Loader2, Edit2, 
    Trash2, CheckCircle2, Play, Ban, FileText, ChevronRight, X, Layers,
    TrendingUp, Calculator, AlertTriangle, Activity, Printer, Target
} from 'lucide-react';
import { manufacturingOrdersService, ManufacturingOrder } from '@/services/manufacturing-orders';
import { productsService, Product } from '@/services/products';
import { purchaseOrdersService } from '@/services/purchase-orders';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { PurchaseNeedModal } from './_components/PurchaseNeedModal';
import { inventoryService, Warehouse } from '@/services/inventory';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { downloadPdf } from '@/lib/download-pdf';
import { toast } from 'sonner';
import { Link } from '@/navigation';



export default function OrdersClient() {
    const t = useTranslations('manufacturing_orders');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Create / Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Partial<ManufacturingOrder> | null>(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<ManufacturingOrder | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [availableFormulas, setAvailableFormulas] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [warehouseStocks, setWarehouseStocks] = useState<Record<string, any>>({});
    const [aggregateStocks, setAggregateStocks] = useState<Record<string, any>>({});
    const [isReplenishing, setIsReplenishing] = useState(false);
    const [isPurchaseNeedModalOpen, setIsPurchaseNeedModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedOrders, fetchedProducts, fetchedWarehouses, fetchedGlobalStocks] = await Promise.all([
                manufacturingOrdersService.getAll(),
                productsService.list(),
                inventoryService.listWarehouses(),
                inventoryService.getStock() // Global aggregate stocks
            ]);
            setOrders(fetchedOrders);
            setProducts(fetchedProducts);
            setWarehouses(fetchedWarehouses);
            
            const globalMap: Record<string, any> = {};
            fetchedGlobalStocks.forEach((s: any) => {
                globalMap[s.id] = {
                    physical: Number(s.stockQuantity),
                    available: Number(s.availableQuantity),
                    reserved: Number(s.reservedQuantity)
                };
            });
            setAggregateStocks(globalMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchWarehouseStocks = async () => {
            if (currentOrder?.warehouseId) {
                try {
                    const stocks = await inventoryService.getStock(currentOrder.warehouseId);
                    const stockMap: Record<string, any> = {};
                    stocks.forEach((s: any) => {
                        stockMap[s.productId] = {
                            physical: Number(s.quantity),
                            available: Number(s.availableQuantity !== undefined ? s.availableQuantity : s.quantity),
                            reserved: Number(s.reservedQuantity || 0)
                        };
                    });
                    setWarehouseStocks(stockMap);
                } catch (error) {
                    console.error("Error fetching warehouse stocks:", error);
                }
            } else {
                setWarehouseStocks({});
            }
        };
        fetchWarehouseStocks();
    }, [currentOrder?.warehouseId]);

    const handleProductSelect = async (productId: string) => {
        const prod = products.find(p => p.id === productId);
        if (prod) {
            setCurrentOrder(prev => ({ ...prev, productId, formulaId: '', unit: prod.unit }));
            setAvailableFormulas([]);
            try {
                const forms = await productsService.getProductFormulas(productId);
                if (forms && forms.length > 0) {
                    const activeFormulas = forms.filter((f: any) => f.status === 'ACTIVE' || f.isActive);
                    const listToUse = activeFormulas.length > 0 ? activeFormulas : forms;
                    setAvailableFormulas(listToUse);
                    const formulaId = listToUse[0]?.id || '';
                    setCurrentOrder(prev => ({ ...prev, formulaId }));
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            setAvailableFormulas([]);
            setCurrentOrder({ ...currentOrder, productId: '', formulaId: '' });
        }
    };

    const previewData = React.useMemo(() => {
        if (!currentOrder?.productId || !currentOrder?.formulaId || !currentOrder?.plannedQuantity) return null;
        const formula = availableFormulas.find(f => f.id === currentOrder.formulaId);
        if (!formula) return null;
        
        const outputQuantity = Number(formula.outputQuantity) || 1;
        const plannedQuantity = Number(currentOrder.plannedQuantity) || 1;
        const factor = plannedQuantity / outputQuantity;

        let totalMatCost = 0;
        let totalShortageCost = 0;
        let shortageCount = 0;
        let totalComponentsCount = formula.components?.length || 0;

        const lines = formula.components?.map((line: any) => {
            const requiredQty = Number(line.quantity) * factor;
            const requiredWithWastage = requiredQty * (1 + (Number(line.wastagePercent) || 0) / 100);
            const costPerUnit = Number(line.component?.standardCost) || Number(line.component?.purchasePriceHt) || 0;
            const lineCost = requiredWithWastage * costPerUnit;
            
            // Use AGGREGATE AVAILABLE stock (Sum of all warehouses - Sum of all reservations)
            const availableStock = aggregateStocks[line.componentProductId]?.available || 0;
            
            const shortageQty = Math.max(0, requiredWithWastage - availableStock);
            const isShortage = shortageQty > 0;
            const isRupture = availableStock === 0;
            
            totalMatCost += lineCost;
            if (isShortage) {
                shortageCount++;
                totalShortageCost += shortageQty * costPerUnit;
            }

            return {
                ...line,
                requiredQty,
                requiredWithWastage,
                costPerUnit,
                lineCost,
                availableStock,
                shortageQty,
                isShortage,
                isRupture
            };
        }) || [];

        return { formula, lines, totalMatCost, totalShortageCost, shortageCount, totalComponentsCount, factor };
    }, [currentOrder?.productId, currentOrder?.formulaId, currentOrder?.plannedQuantity, availableFormulas]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrder?.productId || !currentOrder?.formulaId || !currentOrder?.plannedQuantity || !currentOrder?.plannedDate) {
            setError(ct('error'));
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            await manufacturingOrdersService.create({
                productId: currentOrder.productId,
                formulaId: currentOrder.formulaId,
                warehouseId: currentOrder.warehouseId,
                plannedQuantity: Number(currentOrder.plannedQuantity),
                plannedDate: currentOrder.plannedDate,
                notes: currentOrder.notes
            });
            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message || ct('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const openOrderDetails = async (id: string) => {
        try {
            setLoading(true);
            const detail = await manufacturingOrdersService.getById(id);
            setSelectedOrderDetails(detail);
            setIsCreateMode(false);
            setIsModalOpen(true);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'plan' | 'start' | 'cancel' | 'complete') => {
        if (!selectedOrderDetails) return;
        try {
            setSubmitting(true);
            if (action === 'complete') {
                const isConfirmed = window.confirm(
                    `Confirmer la clôture de la production ?\n\n` +
                    `Ceci va :\n` +
                    `- Consommer les matières premières depuis tous les entrepôts disponibles\n` +
                    `- Entrer le produit fini dans l'entrepôt : ${selectedOrderDetails.warehouse?.name || 'Par défaut'}\n` +
                    `- Mettre à jour le coût de revient standard de l'article\n\n` +
                    `Continuer ?`
                );
                if (!isConfirmed) return;

                const prodQty = window.prompt(t('prompt_produced_qty'), selectedOrderDetails.plannedQuantity.toString());
                if (prodQty === null) return;
                await manufacturingOrdersService.close(selectedOrderDetails.id, Number(prodQty));
            } else if (action === 'start') {
                if (!window.confirm(t('confirm_start_production'))) return;
                await manufacturingOrdersService.start(selectedOrderDetails.id);
            } else if (action === 'plan') {
                await manufacturingOrdersService.plan(selectedOrderDetails.id);
            } else if (action === 'cancel') {
                if (!window.confirm(t('confirm_cancel'))) return;
                await manufacturingOrdersService.cancel(selectedOrderDetails.id);
            }
            // reload detail
            await openOrderDetails(selectedOrderDetails.id);
            await loadData();
            toast.success(ct('success'));
        } catch(e: any) {
            console.error("Action error:", e);
            
            if (e instanceof ApiError && e.data?.error === 'INSUFFICIENT_STOCK') {
                const shortages = e.data.details || [];
                const shortageList = shortages.map((s: any) => `${s.product} (-${s.deficit.toFixed(2)})`).join(', ');
                toast.error(`${e.message}: ${shortageList}`, { duration: 5000 });
            } else {
                const msg = e.message || ct('error');
                toast.error(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              o.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            if (!submitting && !isModalOpen) {
                loadData();
            }
        }, 30000); // 30s
        return () => clearInterval(interval);
    }, [submitting, isModalOpen]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'PLANNED': return 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm';
            case 'IN_PROGRESS': return 'bg-blue-600 text-white border-blue-600 animate-pulse shadow-lg shadow-blue-100';
            case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleGeneratePO = () => {
        setIsPurchaseNeedModalOpen(true);
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header section - Professional ERP Style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                            <Factory size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse"></span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('ops_cockpit')}</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium max-w-xl mt-3 ml-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleGeneratePO}
                        disabled={isReplenishing}
                        className="flex items-center gap-3 bg-white text-blue-600 px-6 py-3.5 rounded-2xl font-black border-2 border-gray-100 shadow-sm hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isReplenishing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="animate-pulse" />}
                        {t('generate_po')}
                    </button>
                    <button
                        onClick={() => {
                            setCurrentOrder({
                                plannedDate: new Date().toISOString().split('T')[0],
                                plannedQuantity: 1
                            });
                            setIsCreateMode(true);
                            setSelectedOrderDetails(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        {t('generate_order')}
                    </button>
                </div>
            </div>

            {/* Tactical Alerts Section - More compact & professional */}
            {(orders.filter(o => o.status === 'PLANNED').some(o => (o as any).hasShortage) || products.filter(p => p.articleType === 'FINISHED_PRODUCT' && (!p.formulas || p.formulas.length === 0)).length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.filter(p => p.articleType === 'FINISHED_PRODUCT' && (!p.formulas || p.formulas.length === 0)).length > 0 && (
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-blue-50">
                            <div className="h-10 w-10 bg-white text-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-blue-900 leading-tight">
                                    {t('missing_formula_alert', { count: products.filter(p => p.articleType === 'FINISHED_PRODUCT' && (!p.formulas || p.formulas.length === 0)).length })}
                                </p>
                                <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest mt-1">{t('needs_attention')}</p>
                            </div>
                        </div>
                    )}
                    {orders.filter(o => o.status === 'PLANNED').filter(o => (o as any).hasShortage).length > 0 && (
                        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-rose-50">
                            <div className="h-10 w-10 bg-white text-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-rose-900 leading-tight">
                                    {t('total_shortages_alert', { count: orders.filter(o => o.status === 'PLANNED').filter(o => (o as any).hasShortage).length })}
                                </p>
                                <p className="text-[9px] font-bold text-rose-600/70 uppercase tracking-widest mt-1">{t('shortage_impact')}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Overview - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title={t('kpi_active')} 
                    value={orders.filter(o => ['PLANNED', 'IN_PROGRESS'].includes(o.status)).length} 
                    icon={Activity} 
                    variant="primary" 
                    type="count" 
                    subtitle={t('status.in_progress')}
                    loading={loading}
                />
                <KpiCard 
                    title={t('kpi_value')} 
                    value={orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + Number(o.totalEstimatedCost), 0)} 
                    icon={TrendingUp} 
                    variant="success" 
                    type="currency" 
                    subtitle="DZD Total"
                    loading={loading}
                />
                <KpiCard 
                    title={t('kpi_shortage')} 
                    value={orders.filter(o => o.status === 'PLANNED' && o.stockReadiness === 'BLOCKING').length} 
                    icon={AlertTriangle} 
                    variant="danger" 
                    type="count" 
                    subtitle={t('shortage_impact')}
                    loading={loading}
                />
            </div>

            {/* List - Ops Cockpit */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-xl overflow-hidden shadow-gray-200/50">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6 bg-gray-50/20">
                    <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                        <h3 className="font-black text-gray-900 whitespace-nowrap flex items-center gap-3 text-lg">
                           <div className="h-2 w-2 bg-blue-600 rounded-full animate-ping"></div>
                           {t('ops_cockpit')}
                        </h3>
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={ct('search')}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                            <button 
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {t('status.all')}
                            </button>
                            {['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-gray-900'}`}
                                >
                                    {t(`status.${s.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('reference')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('product')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('planned_qty')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('stock_readiness')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('status_label')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">{t('cost_variance')}</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                                <tr key={o.id} className="hover:bg-blue-50/30 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600" onClick={() => openOrderDetails(o.id)}>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-black text-gray-900 tracking-tight uppercase bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg w-fit transition-all group-hover:bg-white group-hover:border-blue-100">{o.reference}</span>
                                            <span className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest">{new Date(o.createdAt).toLocaleDateString(locale)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-gray-900 text-base group-hover:text-blue-600 transition-colors leading-tight">{o.product?.name}</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{t('formula_label')} v{o.formula?.version}</span>
                                            {o.formula?.code && <span className="text-[9px] font-black text-blue-500/70 uppercase tracking-widest">{o.formula.code}</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-black text-gray-900 text-lg">{o.plannedQuantity}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.unit}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{t('estimated_cost')} {formatCurrency(o.totalEstimatedCost)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        {o.stockReadiness === 'EXECUTED' ? (
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <CheckCircle2 size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{t('status.completed')}</span>
                                            </div>
                                        ) : o.stockReadiness === 'BLOCKING' ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-tighter">
                                                        <AlertTriangle size={12} /> {t('traffic_blocking')}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-24 bg-rose-100 rounded-full overflow-hidden shadow-inner">
                                                    <div className="h-full bg-rose-500 w-full rounded-full shadow-sm animate-pulse"></div>
                                                </div>
                                            </div>
                                        ) : o.stockReadiness === 'PARTIAL' ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-tighter">
                                                        <AlertCircle size={12} /> {t('traffic_partial')}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-24 bg-blue-100/50 rounded-full overflow-hidden shadow-inner">
                                                    <div className="h-full bg-primary w-[50%] rounded-full shadow-sm"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
                                                        <CheckCircle2 size={12} /> {t('traffic_ready')}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-24 bg-emerald-100 rounded-full overflow-hidden shadow-inner">
                                                    <div className="h-full bg-emerald-500 w-full rounded-full shadow-sm"></div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-sm border ${getStatusColor(o.status)}`}>
                                            {t(`status.${o.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {o.status === 'COMPLETED' && o.totalActualCost ? (
                                            <div className="flex flex-col items-end">
                                                <div className={`flex items-center gap-1 text-base font-black ${Number(o.totalActualCost) > Number(o.totalEstimatedCost) ? 'text-rose-600' : 'text-blue-600'}`}>
                                                    {Number(o.totalActualCost) > Number(o.totalEstimatedCost) ? <TrendingUp size={14} className="rotate-45" /> : <TrendingUp size={14} className="-rotate-45" />}
                                                    {formatCurrency(Math.abs(Number(o.totalActualCost) - Number(o.totalEstimatedCost)))}
                                                </div>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('variance')}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end group-hover:translate-x-[-4px] transition-transform">
                                                <span className="text-base font-black text-gray-900">{formatCurrency(o.totalEstimatedCost)}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('estimated_cost')}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-90 transition-all shadow-sm border border-gray-100 group-hover:border-blue-600">
                                            <ChevronRight size={20} />
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center grayscale opacity-30">
                                            <Factory size={64} className="mb-4 text-gray-400" />
                                            <p className="font-black text-gray-900 tracking-widest uppercase text-xs">{ct('no_data')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Professional structured layout */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md transition-opacity duration-500" onClick={() => setIsModalOpen(false)}></div>
                    <div className={`bg-white rounded-[3rem] w-full ${!isCreateMode ? 'max-w-7xl' : 'max-w-6xl'} flex flex-col relative z-50 shadow-2xl border border-white/20 overflow-hidden max-h-[95vh] animate-in zoom-in-95 fade-in duration-300`}>
                        
                        {/* Modal Header - Premium Industrial Style */}
                        <div className="p-8 md:p-10 flex items-center justify-between border-b border-gray-50 shrink-0 bg-white">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200">
                                    <Factory size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight">
                                        {isCreateMode ? t('new_order') : selectedOrderDetails?.reference}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {!isCreateMode ? (
                                            <>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest border ${getStatusColor(selectedOrderDetails?.status || 'DRAFT')}`}>
                                                    {t(`status.${selectedOrderDetails?.status.toLowerCase()}`)}
                                                </span>
                                                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest border ${selectedOrderDetails?.lines?.some((l: any) => l.stockStatus === 'INSUFFICIENT') ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                    {selectedOrderDetails?.lines?.some((l: any) => l.stockStatus === 'INSUFFICIENT') ? t('traffic_insufficient') : t('traffic_ready')}
                                                </span>
                                                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {selectedOrderDetails?.product?.name}
                                                </span>
                                            </>
                                        ) : (
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">{t('generate_order')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-900 transition-all bg-gray-50 hover:bg-gray-100 p-3 rounded-2xl active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content - Structured Workflow */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-10 bg-gray-50/30">
                            {isCreateMode ? (
                                <form id="mo-form" onSubmit={handleCreateSubmit} className="space-y-8">
                                    {error && (
                                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-700 text-sm font-black flex items-center gap-4 animate-in shake duration-500">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100"><AlertCircle size={24} /></div>
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                        {/* Left Side: Order Configuration Block */}
                                        <div className="lg:col-span-5 space-y-8">
                                            <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm space-y-8 transition-all hover:shadow-md">
                                                <div>
                                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.25em] flex items-center gap-2 mb-6">
                                                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                                        {t('block_a_header')}
                                                    </h3>
                                                    
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">{t('product')}</label>
                                                            <div className="relative group">
                                                                <select
                                                                    required
                                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-gray-900 shadow-sm appearance-none cursor-pointer"
                                                                    value={currentOrder?.productId || ''}
                                                                    onChange={(e) => handleProductSelect(e.target.value)}
                                                                >
                                                                    <option value="">{t('select_product')}</option>
                                                                    {products.map(p => (
                                                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={18} className="rotate-90" /></div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">{t('formula')}</label>
                                                            {currentOrder?.productId && availableFormulas.length === 0 ? (
                                                                <div className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-3">
                                                                    <AlertCircle size={18} /> {t('no_active_formula')}
                                                                </div>
                                                            ) : (
                                                                <div className="relative group">
                                                                    <select
                                                                        required
                                                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-gray-900 shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                                                                        value={currentOrder?.formulaId || ''}
                                                                        onChange={(e) => setCurrentOrder({ ...currentOrder, formulaId: e.target.value })}
                                                                        disabled={!currentOrder?.productId}
                                                                    >
                                                                        <option value="">{t('select_formula')}</option>
                                                                        {availableFormulas.map(f => (
                                                                            <option key={f.id} value={f.id}>{f.name} (v{f.version})</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={18} className="rotate-90" /></div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">{t('planned_qty')}</label>
                                                                <div className="relative">
                                                                    <input
                                                                        required
                                                                        type="number"
                                                                        step="0.001"
                                                                        className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-lg text-blue-600 shadow-sm"
                                                                        value={currentOrder?.plannedQuantity || ''}
                                                                        onChange={(e) => setCurrentOrder({ ...currentOrder, plannedQuantity: e.target.value })}
                                                                    />
                                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase bg-white px-2 py-1 rounded-lg border border-gray-100">{currentOrder?.unit || 'U'}</span>
                                                                </div>
                                                            </div>
                                                                    <div className="space-y-2">
                                                                <label className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">{t('planned_date')}</label>
                                                                <input
                                                                    required
                                                                    type="date"
                                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-gray-700 shadow-sm"
                                                                    value={currentOrder?.plannedDate || ''}
                                                                    onChange={(e) => setCurrentOrder({ ...currentOrder, plannedDate: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">{t('warehouse_destination') || 'Entrepôt de Destination (Produit Fini)'}</label>
                                                            <div className="relative group">
                                                                <select
                                                                    required
                                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-gray-900 shadow-sm appearance-none cursor-pointer"
                                                                    value={currentOrder?.warehouseId || ''}
                                                                    onChange={(e) => setCurrentOrder({ ...currentOrder, warehouseId: e.target.value })}
                                                                >
                                                                    <option value="">Sélectionner l'entrepôt</option>
                                                                    {warehouses.map(w => (
                                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={18} className="rotate-90" /></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Production Preview Block */}
                                            {previewData && (
                                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 delay-150">
                                                    <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-8 rounded-4xl text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                                                        <div className="relative z-10">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">{t('estimated_cost')}</p>
                                                            <p className="text-4xl font-black mb-2 tracking-tighter leading-none">{formatCurrency(previewData.totalMatCost)}</p>
                                                            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                                                                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('unit_cost')}</span>
                                                                <span className="font-black text-indigo-100">{formatCurrency(previewData.totalMatCost / (Number(currentOrder?.plannedQuantity) || 1))}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`p-8 rounded-4xl border shadow-sm transition-all duration-500 ${previewData.shortageCount > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-blue-50/50/50 border-blue-100/50'}`}>
                                                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-50 ${previewData.shortageCount > 0 ? 'text-rose-900' : 'text-slate-900'}`}>{t('stock_readiness')}</p>
                                                        <div className="flex items-center gap-5">
                                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${previewData.shortageCount > 0 ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-blue-600 text-white shadow-emerald-200'}`}>
                                                                {previewData.shortageCount > 0 ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
                                                            </div>
                                                            <div>
                                                                <p className={`text-2xl font-black leading-tight ${previewData.shortageCount > 0 ? 'text-rose-900' : 'text-slate-900'}`}>
                                                                    {previewData.shortageCount > 0 ? `${previewData.shortageCount} ${t('shortage_short')}` : t('ready')}
                                                                </p>
                                                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1 ${previewData.shortageCount > 0 ? 'text-rose-600' : 'text-primary'}`}>
                                                                    {previewData.shortageCount > 0 ? t('needs_attention') : t('ready_to_start')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {previewData.shortageCount > 0 && (
                                                            <div className="mt-6 p-4 bg-white/60 border border-rose-100 rounded-2xl text-[10px] font-medium text-rose-700 leading-relaxed animate-in slide-in-from-top-2 duration-500">
                                                                <p className="font-bold mb-1 uppercase tracking-widest flex items-center gap-2">
                                                                    <AlertCircle size={12} /> {t('shortage_alert')}
                                                                </p>
                                                                {t('total_shortages_alert', { count: previewData.shortageCount })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Material Requirements Table Block */}
                                        <div className="lg:col-span-7 flex flex-col">
                                            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px] hover:shadow-md transition-shadow">
                                                <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white">
                                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                        <Layers size={20} className="text-blue-600" />
                                                        {t('material_requirements')}
                                                    </h3>
                                                    {previewData && (
                                                       <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-xl uppercase tracking-widest border border-blue-100">
                                                           {previewData.totalComponentsCount} {t('components')}
                                                       </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 overflow-y-auto">
                                                    {!previewData ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-300 p-16 text-center">
                                                            <div className="bg-gray-50 h-24 w-24 rounded-4xl flex items-center justify-center mb-6">
                                                                <Calculator size={48} className="opacity-20 translate-y-[-2px]" />
                                                            </div>
                                                            <p className="text-xs font-black uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                                                                {currentOrder?.productId ? t('select_formula') : t('select_product')}
                                                            </p>
                                                        </div>
                                                    ) : !currentOrder?.warehouseId ? (
                                                        <div className="flex flex-col items-center justify-center py-20 bg-amber-50/30 rounded-3xl border border-dashed border-amber-200 m-8 text-center px-8">
                                                            <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                                                                <Layers size={24} />
                                                            </div>
                                                            <p className="text-sm font-black text-amber-900 uppercase tracking-widest">{t('warehouse_destination') || 'Entrepôt de Destination'}</p>
                                                            <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mt-1">Veuillez sélectionner l'entrepôt qui recevra le produit fini.<br/>Les matières premières seront puisées automatiquement dans tout votre réseau.</p>
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-left border-collapse">
                                                            <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-50">
                                                                <tr>
                                                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('component')}</th>
                                                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('required')}</th>
                                                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('available_stock') || 'Stock Disponible'}</th>
                                                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('status_label')}</th>
                                                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">{t('line_cost')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {previewData.lines.map((line: any) => (
                                                                    <tr key={line.id} className={`hover:bg-gray-50/80 transition-colors ${line.isShortage ? 'bg-rose-50/20' : ''} group`}>
                                                                        <td className="px-8 py-5">
                                                                            <div className="font-black text-gray-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors">{line.component?.name}</div>
                                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 bg-gray-50 px-1.5 py-0.5 rounded-md w-fit border border-gray-100">{line.component?.sku}</div>
                                                                        </td>
                                                                        <td className="px-8 py-5">
                                                                            <div className="flex items-baseline gap-1">
                                                                                <span className="font-black text-blue-600 text-base">{line.requiredWithWastage.toFixed(3)}</span>
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{line.component?.unit || 'U'}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-8 py-5">
                                                                            <div className="flex items-baseline gap-1">
                                                                                <span className={`font-black text-sm ${line.isShortage ? 'text-rose-600' : 'text-gray-700'}`}>{line.availableStock.toFixed(3)}</span>
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{line.component?.unit || 'U'}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-8 py-5">
                                                                            {line.isRupture ? (
                                                                                <span className="text-rose-600 font-black text-[9px] uppercase tracking-tighter flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 w-fit">
                                                                                    <X size={10} /> {t('status_insufficient' as any) || 'RUPTURE'}
                                                                                </span>
                                                                            ) : line.isShortage ? (
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-orange-600 font-black text-[9px] uppercase tracking-tighter flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 w-fit">
                                                                                       <AlertCircle size={10} /> {t('traffic_partial' as any) || 'PARTIEL'}
                                                                                    </span>
                                                                                    <span className="text-[9px] font-bold text-orange-400 mt-1">
                                                                                        {t('shortage')}: -{line.shortageQty.toFixed(2)}
                                                                                    </span>
                                                                                    <Link href={{ pathname: '/purchases/orders', query: { productId: line.component?.id, qty: line.shortageQty.toFixed(2) } } as any} className="text-[10px] font-black uppercase flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors w-fit px-2 py-1.5 hover:bg-slate-100 rounded-lg mt-1 group" title="Créer un Bon de Commande pour cet article">
                                                                                        <ShoppingCart size={12} className="group-hover:scale-110 transition-transform" /> Quick Buy
                                                                                    </Link>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-emerald-600 font-black text-[9px] uppercase tracking-tighter flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 w-fit">
                                                                                    <CheckCircle2 size={10} /> {t('status_enough') || 'SUFFISANT'}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-8 py-5 font-black text-gray-900 text-right text-xs">
                                                                            {formatCurrency(line.lineCost)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Action Bar */}
                                    <div className="pt-10 border-t border-gray-100 flex items-center justify-between shrink-0 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-10 py-5 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:text-gray-900 transition-all active:scale-95 hover:bg-gray-50"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || !currentOrder?.formulaId || (previewData ? previewData.shortageCount > 0 : false)}
                                            className="bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white px-16 py-5 rounded-3xl font-black shadow-2xl shadow-gray-200 transition-all active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em] text-xs"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                                                <><CheckCircle2 size={20} /> {t('generate_order')}</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : selectedOrderDetails ? (
                                <div className="space-y-4">
                                    {/* Command Center Stats - Elite Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{t('production_goal')}</p>
                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${selectedOrderDetails.status === 'COMPLETED' ? 'bg-blue-50/50 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                                                    <Target size={18} />
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-4">
                                                <span className="text-5xl font-black text-gray-900 tracking-tighter">
                                                    {selectedOrderDetails.status === 'COMPLETED' ? selectedOrderDetails.producedQuantity : selectedOrderDetails.plannedQuantity}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{selectedOrderDetails.unit}</span>
                                            </div>
                                            <div className="mt-8 space-y-3">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-gray-400">{t('efficiency')}</span>
                                                    <span className={selectedOrderDetails.status === 'COMPLETED' ? 'text-primary' : 'text-blue-600'}>
                                                        {selectedOrderDetails.status === 'COMPLETED' ? '100%' : t('status.in_progress')}
                                                    </span>
                                                </div>
                                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 shadow-sm ${selectedOrderDetails.status === 'COMPLETED' ? 'bg-primary w-full' : selectedOrderDetails.status === 'IN_PROGRESS' ? 'bg-blue-500 w-1/2 animate-pulse' : 'bg-gray-300 w-0'}`}
                                                    ></div>
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">{new Date(selectedOrderDetails.plannedDate).toLocaleDateString(locale)}</div>
                                            </div>
                                        </div>

                                        <div className="bg-linear-to-br from-gray-900 to-black p-8 rounded-4xl text-white shadow-2xl relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">{t('estimated_cost')}</div>
                                                <div className="text-3xl font-black mb-1 leading-none tracking-tighter">{formatCurrency(selectedOrderDetails.totalEstimatedCost)}</div>
                                                <div className="pt-6 border-t border-white/10 mt-6 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">{t('formula')}</span>
                                                        <span className="text-[10px] font-black text-blue-400">v{selectedOrderDetails.formula?.version}</span>
                                                    </div>
                                                    {(selectedOrderDetails as any).warehouse && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">{t('warehouse_destination') || 'Entrepôt Destination'}</span>
                                                            <span className="text-[10px] font-black text-blue-200">{(selectedOrderDetails as any).warehouse.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-8 rounded-4xl border shadow-sm transition-all duration-500 ${selectedOrderDetails.status === 'COMPLETED' ? (Number(selectedOrderDetails.totalActualCost) > Number(selectedOrderDetails.totalEstimatedCost) ? 'bg-rose-50 border-rose-100 shadow-rose-100/20' : 'bg-blue-50/50 border-blue-100/50 shadow-blue-100/50/20') : 'bg-white border-gray-100'}`}>
                                             <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${selectedOrderDetails.status === 'COMPLETED' ? (Number(selectedOrderDetails.totalActualCost) > Number(selectedOrderDetails.totalEstimatedCost) ? 'text-rose-600/60' : 'text-primary/60') : 'text-gray-400'}`}>
                                                {selectedOrderDetails.status === 'COMPLETED' ? t('actual_cost') : t('cost_variance')}
                                            </div>
                                            {selectedOrderDetails.status === 'COMPLETED' ? (
                                                <div className="space-y-4">
                                                    <div className={`text-3xl font-black leading-none tracking-tighter ${Number(selectedOrderDetails.totalActualCost) > Number(selectedOrderDetails.totalEstimatedCost) ? 'text-rose-600' : 'text-primary'}`}>
                                                        {formatCurrency(selectedOrderDetails.totalActualCost)}
                                                    </div>
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${Number(selectedOrderDetails.totalActualCost) > Number(selectedOrderDetails.totalEstimatedCost) ? 'bg-rose-100 text-rose-700' : 'bg-blue-100/50 text-blue-700'}`}>
                                                        <TrendingUp size={12} className={Number(selectedOrderDetails.totalActualCost) > Number(selectedOrderDetails.totalEstimatedCost) ? 'rotate-45' : '-rotate-45'} />
                                                        {((Number(selectedOrderDetails.totalActualCost) / Number(selectedOrderDetails.totalEstimatedCost) - 1) * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-20 grayscale opacity-20">
                                                    <Loader2 className="animate-spin text-gray-400" size={32} />
                                                    <div className="text-[9px] font-black uppercase tracking-widest mt-2">{t('status.in_progress')}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Material Execution Cockpit */}
                                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px] hover:shadow-md transition-shadow">
                                        <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-gray-50/10">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                                    <Layers size={18} />
                                                </div>
                                                {t('material_requirements')}
                                                <span className="text-[10px] font-black text-blue-600/50 normal-case tracking-normal ml-2">
                                                    (Sourcing automatique : Tous entrepôts)
                                                </span>
                                            </h3>
                                            <button 
                                                onClick={() => downloadPdf(manufacturingOrdersService.getPdfUrl(selectedOrderDetails.id), `ordre-travail-${selectedOrderDetails.reference}.pdf`)}
                                                className="flex items-center gap-3 text-[10px] font-black text-blue-600 bg-blue-50 uppercase tracking-widest hover:bg-blue-100 px-5 py-2.5 rounded-2xl border border-blue-100 transition-all active:scale-95 shadow-sm"
                                            >
                                                <Printer size={16} /> {t('print_order')}
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white border-b border-gray-50">
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('component')}</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('required')}</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('consumed')}</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">{t('cost')}</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('stock_status')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {selectedOrderDetails.lines?.map((line: any) => (
                                                        <tr key={line.id} className="group hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-6 py-3">
                                                                <div className="font-black text-gray-900 text-sm group-hover:text-blue-600 transition-colors tracking-tight">{line.component?.name || '—'}</div>
                                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 bg-gray-50 px-1.5 py-0.5 rounded-md w-fit border border-gray-100">{line.component?.sku}</div>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className="font-black text-blue-600 text-base">{Number(line.requiredQuantity).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{line.unit}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className={`font-black text-base ${Number(line.consumedQuantity) > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{Number(line.consumedQuantity).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{line.unit}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="font-black text-gray-900 text-xs">{formatCurrency(line.estimatedLineCost)}</span>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    {line.stockStatus === 'ENOUGH' ? (
                                                                        <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                                                            <CheckCircle2 size={10} /> {t('status_enough') || 'SUFFISANT'}
                                                                        </span>
                                                                    ) : line.stockStatus === 'LOW' ? (
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="px-3 py-1 rounded-xl bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-100 flex items-center gap-1 w-fit">
                                                                                <AlertCircle size={10} /> {t('traffic_partial' as any) || 'PARTIEL'}
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 w-fit mt-1">
                                                                                Manquant: -{Number(line.shortageQuantity).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {line.unit}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                                                                            <X size={10} /> {t('status_insufficient' as any) || 'RUPTURE'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Order Detail Action Footer - Premium Navigation */}
                        {!isCreateMode && selectedOrderDetails && (
                            <div className="p-8 md:p-10 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                                <button
                                    onClick={() => handleAction('cancel')}
                                    disabled={['COMPLETED', 'CANCELLED'].includes(selectedOrderDetails.status)}
                                    className="px-8 py-5 rounded-2xl text-rose-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                                >
                                    {t('cancel_order')}
                                </button>
                                
                                <div className="flex items-center gap-4">
                                    {selectedOrderDetails.status === 'DRAFT' && (
                                        <button 
                                            onClick={() => handleAction('plan')} 
                                            disabled={submitting || selectedOrderDetails.lines?.some((l: any) => l.stockStatus !== 'ENOUGH')}
                                            className="px-12 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-3xl font-black shadow-2xl shadow-blue-100 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs active:scale-95"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Target size={20} /> {t('plan_production')}</>}
                                        </button>
                                    )}
                                    {selectedOrderDetails.status === 'PLANNED' && (
                                        <button 
                                            onClick={() => handleAction('start')} 
                                            disabled={submitting || selectedOrderDetails.lines?.some((l: any) => l.stockStatus !== 'ENOUGH')}
                                            className="px-12 py-5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-3xl font-black shadow-2xl shadow-amber-100 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs active:scale-95"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Play size={20} className="fill-current" /> {t('start_production')}</>}
                                        </button>
                                    )}
                                    {selectedOrderDetails.status === 'IN_PROGRESS' && (
                                        <button 
                                            onClick={() => handleAction('complete')} 
                                            disabled={submitting || selectedOrderDetails.lines?.some((l: any) => l.stockStatus === 'INSUFFICIENT')}
                                            className={`px-12 py-5 text-white rounded-3xl font-black shadow-2xl transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${selectedOrderDetails.lines?.some((l: any) => l.stockStatus === 'INSUFFICIENT') ? 'bg-gray-400 shadow-none' : 'bg-primary hover:bg-blue-700 shadow-blue-100/50'}`}
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> {t('complete_production')}</>}
                                        </button>
                                    )}
                                    {['COMPLETED', 'CANCELLED'].includes(selectedOrderDetails.status) && (
                                        <button 
                                            onClick={() => setIsModalOpen(false)} 
                                            className="px-12 py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-black shadow-2xl shadow-gray-200 transition-all uppercase tracking-[0.2em] text-xs active:scale-95"
                                        >
                                            {t('common.consult')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Purchase Need Modal */}
            <PurchaseNeedModal 
                isOpen={isPurchaseNeedModalOpen} 
                onClose={() => setIsPurchaseNeedModalOpen(false)} 
                onSuccess={loadData}
            />
        </div>
    );
}
