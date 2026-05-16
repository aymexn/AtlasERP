'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    ShoppingBag, Search, Plus, Loader2, Edit2, Trash2, 
    ArrowRight, Filter, FileText, Download, CheckCircle2, X,
    Calendar, TrendingUp, AlertTriangle, Info, Package, MoreVertical,
    FileSearch, Truck, History, Calculator, ShoppingCart, LayoutGrid, Settings,
    Clock, Check, PackageSearch, MinusCircle, PlusCircle, Users, Warehouse
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PurchaseOrder } from '@/services/purchases';
import { Supplier } from '@/services/suppliers';
import { Product } from '@/services/products';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { apiFetch } from '@/lib/api';
import { Combobox } from '@/components/ui/combobox';

export default function OrdersClient() {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'items' | 'summary'>('general');
    const [submitting, setSubmitting] = useState(false);
    
    interface OrderLineForm { productId: string; quantity: number | string; unit: string; unitPriceHt: number | string; taxRate: number }
    interface OrderForm { supplierId: string; orderDate: string; expectedDate: string; notes: string; status: string; warehouseId?: string; lines: OrderLineForm[] }
    
    const [formState, setFormState] = useState<OrderForm>({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: '',
        status: 'DRAFT',
        warehouseId: '',
        lines: [{ productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
    });

    const searchParams = useSearchParams();

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);

    // Auto-open modal if URL params for Quick Buy are present
    useEffect(() => {
        if (!isMounted || availableProducts.length === 0 || suppliers.length === 0) return;
        
        const productId = searchParams.get('productId');
        const qty = searchParams.get('qty') || searchParams.get('quantity');

        if (productId) {
            const product = availableProducts.find(p => p.id === productId);
            if (product) {
                // Find preferred supplier if any, otherwise keep empty
                // Assuming product model doesn't explicitly have preferredSupplierId in the local interface, 
                // but we can check if it exists or default to empty
                const supplierId = (product as any).preferredSupplierId || '';
                
                setFormState({
                    supplierId: supplierId,
                    orderDate: new Date().toISOString().split('T')[0],
                    expectedDate: '',
                    notes: '',
                    status: 'DRAFT',
                    warehouseId: '',
                    lines: [{ 
                        productId: product.id, 
                        quantity: Number(qty) || 1, 
                        unit: product.unit || 'U', 
                        unitPriceHt: Number(product.purchasePriceHt) || 0, 
                        taxRate: 0.19 
                    }]
                });
                setActiveTab('items');
                setIsModalOpen(true);
            }
        }
    }, [isMounted, searchParams, availableProducts, suppliers]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, suppliersData, productsData, warehousesData] = await Promise.all([
                apiFetch('/purchase-orders'),
                apiFetch('/suppliers'),
                apiFetch('/products'),
                apiFetch('/warehouses')
            ]);
            setOrders(Array.isArray(ordersData) ? ordersData : ordersData.data ?? []);
            setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data ?? []);
            setAvailableProducts(Array.isArray(productsData) ? productsData : productsData.data ?? []);
            setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.data ?? []);
            
            if (Array.isArray(warehousesData) && warehousesData.length > 0) {
                setFormState(prev => ({ ...prev, warehouseId: warehousesData[0].id }));
            } else if (warehousesData?.data?.length > 0) {
                setFormState(prev => ({ ...prev, warehouseId: warehousesData.data[0].id }));
            }
        } catch (err) {
            console.error('[OrdersClient] Failed to load data:', err);
            toast.error(ct('errors.fetch_failed' as any) || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formState.supplierId) {
            toast.error(t('orders.errors.no_supplier' as any) || 'Veuillez sélectionner un fournisseur');
            return;
        }
        if (formState.lines.some(l => !l.productId || Number(l.quantity) <= 0)) {
            toast.error(t('orders.errors.invalid_lines' as any) || 'Veuillez compléter correctement toutes les lignes');
            return;
        }

        const payload = {
            supplierId: formState.supplierId,
            orderDate: formState.orderDate,
            expectedDate: formState.expectedDate || undefined,
            notes: formState.notes || undefined,
            status: formState.status,
            warehouseId: formState.status === 'FULLY_RECEIVED' ? formState.warehouseId : undefined,
            lines: formState.lines.map(line => ({
                productId: line.productId,
                quantity: Number(line.quantity),
                unit: line.unit,
                unitPriceHt: Number(line.unitPriceHt),
                taxRate: 0.19
            }))
        };

        try {
            setSubmitting(true);
            await apiFetch('/purchase-orders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const message = payload.status === 'FULLY_RECEIVED' 
                ? 'Commande et Stock mis à jour avec succès' 
                : (t('orders.success.created' as any) || 'BCF créé avec succès');
            
            toast.success(message);
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            console.error('[OrdersClient] Submit error:', err);
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const updateLine = (index: number, field: string, value: any) => {
        const lines = [...formState.lines];
        lines[index] = { ...lines[index], [field]: value };
        if (field === 'productId') {
            const product = availableProducts.find(p => p.id === value);
            if (product) {
                lines[index].unit = product.unit || 'U';
                lines[index].unitPriceHt = product.purchasePriceHt !== null && product.purchasePriceHt !== undefined ? Number(product.purchasePriceHt) : 0;
            }
        }
        setFormState({ ...formState, lines });
    };

    const totals = useMemo(() => {
        let ht = 0;
        let tva = 0;
        formState.lines.forEach(l => {
            const lineHt = Number(l.quantity) * Number(l.unitPriceHt);
            ht += lineHt;
            tva += lineHt * Number(l.taxRate);
        });
        return { ht, tva, ttc: ht + tva };
    }, [formState.lines]);

    const filteredOrders = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return orders.filter(o => 
            o.reference?.toLowerCase().includes(term) || 
            o.supplier?.name?.toLowerCase().includes(term)
        );
    }, [orders, searchTerm]);

    const getStatusVariant = (status: string) => {
        switch(status) {
            case 'DRAFT': return 'draft';
            case 'SENT': return 'info';
            case 'CONFIRMED': return 'confirmed';
            case 'PARTIALLY_RECEIVED': return 'warning';
            case 'FULLY_RECEIVED': return 'active';
            case 'CANCELLED': return 'cancelled';
            default: return 'primary';
        }
    };

    if (!isMounted || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            <PageHeader 
                title={t('orders.title')}
                subtitle={t('orders.subtitle')}
                icon={ShoppingBag}
                action={{
                    label: t('orders.add'),
                    onClick: () => router.push(`/${locale}/purchases/orders/new`),
                    icon: Plus
                }}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title={t('orders.kpi.active_orders')}
                    value={orders.filter(o => !['FULLY_RECEIVED', 'CANCELLED'].includes(o.status)).length}
                    icon={Truck}
                    variant="primary"
                    type="count"
                    loading={loading}
                />
                <KpiCard 
                    title={t('orders.kpi.total_cost')}
                    value={orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + Number(o.totalTtc), 0)}
                    icon={Calculator}
                    variant="info"
                    type="currency"
                    loading={loading}
                />
                <KpiCard 
                    title={t('orders.kpi.received')}
                    value={orders.filter(o => o.status === 'FULLY_RECEIVED').length}
                    icon={CheckCircle2}
                    variant="success"
                    type="count"
                    loading={loading}
                />
                <KpiCard 
                    title={t('orders.kpi.pending')}
                    value={orders.filter(o => o.status === 'PARTIALLY_RECEIVED').length}
                    icon={Clock}
                    variant="warning"
                    type="count"
                    loading={loading}
                />
            </div>

            {/* Main Table */}
            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-4xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <PackageSearch className="w-6 h-6 text-primary" />
                        {t('orders.title')}
                    </CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder={ct('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold h-[52px]"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                        data={filteredOrders}
                        isLoading={loading}
                        onRowClick={(row) => router.push(`/${locale}/purchases/orders/${row.id}`)}
                        columns={[
                            {
                                header: t('reference') || "RÉFÉRENCE",
                                className: "w-[160px]",
                                accessor: (row) => (
                                    <div className="px-3 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] rounded-lg font-black tracking-tight inline-block uppercase">
                                        {row.reference}
                                    </div>
                                )
                            },
                            {
                                header: t('supplier') || "FOURNISSEUR",
                                className: "w-[250px]",
                                accessor: (row) => <span className="text-slate-900 font-black text-[15px] tracking-tight">{row.supplier?.name}</span>
                            },
                            {
                                header: ct('date') || "DATE",
                                accessor: (row) => <span className="text-sm font-bold text-slate-500">{new Date(row.orderDate).toLocaleDateString(locale)}</span>
                            },
                            {
                                header: ct('status'),
                                accessor: (row) => (
                                    <Badge variant={getStatusVariant(row.status) as any}>
                                        {t(`STATUS.${row.status}`)}
                                    </Badge>
                                )
                            },
                            {
                                header: t('total_ttc') || "TOTAL TTC",
                                align: 'right',
                                className: "pr-8",
                                accessor: (row) => <span className="text-slate-900 font-black">{formatCurrency(row.totalTtc)}</span>
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Elite Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className={`bg-white rounded-[3rem] w-full ${activeTab === 'items' ? 'max-w-6xl' : 'max-w-2xl'} relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100`}>
                        {/* Premium Minimalist Header */}
                        <div className="p-10 pb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {t('orders.add')}
                                </h2>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {t('orders.add_subtitle')}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="h-10 w-10 bg-slate-100 text-slate-400 hover:text-slate-900 transition-all rounded-full flex items-center justify-center border border-slate-200 shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Minimalist Professional Tabs */}
                        <div className="flex px-10 gap-8 border-b border-slate-50 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'general', label: ct('general_info' as any) || "Général", icon: Info },
                                { id: 'items', label: t('orders.form.items_title' as any) || "Articles", icon: Package },
                                { id: 'summary', label: t('orders.form.summary_title' as any) || "Récapitulatif", icon: Calculator },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-5 border-b-4 transition-all font-bold text-sm whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-300 hover:text-slate-500'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="col-span-2 space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">{t('orders.form.supplier' as any) || 'Fournisseur'}</label>
                                            <Combobox 
                                                options={suppliers.map(s => ({ label: `${s.name} (${s.code || 'NO-CODE'})`, value: s.id }))}
                                                value={formState.supplierId}
                                                onChange={(val) => setFormState({ ...formState, supplierId: val })}
                                                placeholder={ct('select_placeholder' as any) || 'Sélectionner un partenaire...'}
                                                searchPlaceholder="Rechercher un fournisseur..."
                                                icon={Users}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">{t('orders.form.order_date' as any) || 'Date émission'}</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                                <input 
                                                    type="date"
                                                    required
                                                    className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-slate-900 shadow-sm"
                                                    value={formState.orderDate}
                                                    onChange={(e) => setFormState({ ...formState, orderDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">{t('orders.form.expected_date' as any) || 'Livraison prévue'}</label>
                                            <div className="relative">
                                                <Truck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                                <input 
                                                    type="date"
                                                    className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-slate-900 shadow-sm"
                                                    value={formState.expectedDate}
                                                    onChange={(e) => setFormState({ ...formState, expectedDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">{t('orders.form.notes' as any) || 'Notes & Instructions'}</label>
                                            <textarea 
                                                className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-4xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 min-h-[140px] shadow-sm resize-none"
                                                placeholder="Conditions particulières de livraison..."
                                                value={formState.notes}
                                                onChange={(e) => setFormState({...formState, notes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'items' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lignes de commande ({formState.lines.length})</h3>
                                        <button 
                                            type="button"
                                            onClick={() => setFormState({...formState, lines: [...formState.lines, { productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]})}
                                            className="px-4 py-2 bg-blue-50 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={14} /> {t('orders.form.add_line' as any) || 'Ajouter Ligne'}
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Column Headers */}
                                        <div className="hidden md:flex gap-3 px-4 py-2 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="flex-2 min-w-[200px]">Article</div>
                                            <div className="w-28 text-center">Quantité</div>
                                            <div className="w-40 text-right">P.U HT (DA)</div>
                                            <div className="w-40 text-right">Total HT</div>
                                            <div className="w-11"></div>
                                        </div>

                                        {formState.lines.map((l, i) => (
                                            <div key={i} className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group items-center">
                                                <div className="flex-2 min-w-[200px] w-full">
                                                    <label className="md:hidden text-[9px] font-black text-slate-400 uppercase mb-1 block">Article</label>
                                                    <Combobox 
                                                        options={availableProducts.map(p => ({ label: `${p.name} (${p.sku || 'N/A'})`, value: p.id }))}
                                                        value={l.productId}
                                                        onChange={(val) => updateLine(i, 'productId', val)}
                                                        placeholder={t('orders.form.product_placeholder' as any) || 'Sélectionner un article...'}
                                                        className="h-11 rounded-xl"
                                                    />
                                                </div>
                                                <div className="w-full md:w-28">
                                                    <label className="md:hidden text-[9px] font-black text-slate-400 uppercase mb-1 block text-center">Quantité</label>
                                                    <input 
                                                        type="number"
                                                        placeholder="Qté"
                                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-black text-slate-800 text-center"
                                                        value={l.quantity}
                                                        onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-full md:w-40">
                                                    <label className="md:hidden text-[9px] font-black text-slate-400 uppercase mb-1 block text-right">P.U HT (DA)</label>
                                                    <input 
                                                        type="number"
                                                        placeholder="P.U HT"
                                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-black text-slate-800 text-right"
                                                        value={l.unitPriceHt}
                                                        onChange={(e) => updateLine(i, 'unitPriceHt', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-full md:w-40 flex flex-col justify-center items-end pr-2">
                                                    <label className="md:hidden text-[9px] font-black text-slate-400 uppercase mb-1 block">Total HT</label>
                                                    <span className="text-sm font-black text-slate-900">
                                                        {formatCurrency(Number(l.quantity || 0) * Number(l.unitPriceHt || 0))}
                                                    </span>
                                                </div>
                                                <div className="w-full md:w-11 flex items-center justify-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormState({...formState, lines: formState.lines.filter((_, idx) => idx !== i)})}
                                                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <MinusCircle size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'summary' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-slate-900 rounded-4xl p-10 text-white space-y-8 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Calculator size={80} />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t('orders.form.financial_summary')}</h3>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center opacity-60">
                                                <span className="text-xs font-bold uppercase tracking-widest">{ct('total_ht')}</span>
                                                <span className="text-lg font-black">{formatCurrency(totals.ht)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-blue-400">
                                                <span className="text-xs font-bold uppercase tracking-widest">{ct('tva')} (19%)</span>
                                                <span className="text-lg font-black">+{formatCurrency(totals.tva)}</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-4" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black uppercase tracking-widest text-primary">TOTAL TTC</span>
                                                <span className="text-4xl font-black tracking-tighter">{formatCurrency(totals.ttc)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] space-y-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${formState.status === 'FULLY_RECEIVED' ? 'bg-green-600 text-white shadow-green-100' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{t('orders.form.direct_stock')}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('orders.form.direct_stock_desc')}</p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setFormState({...formState, status: formState.status === 'FULLY_RECEIVED' ? 'SENT' : 'FULLY_RECEIVED'})}
                                                className={`w-16 h-9 rounded-full p-1.5 transition-all flex items-center ${formState.status === 'FULLY_RECEIVED' ? 'bg-green-600' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all transform ${formState.status === 'FULLY_RECEIVED' ? 'translate-x-7' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {formState.status === 'FULLY_RECEIVED' && (
                                            <div className="pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Warehouse size={14} className="text-slate-400" />
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('receptions.fields.warehouse')}</label>
                                                </div>
                                                <select 
                                                    className="w-full h-14 px-6 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-green-600 focus:bg-white transition-all font-black text-slate-900 text-sm shadow-sm"
                                                    value={formState.warehouseId}
                                                    onChange={(e) => setFormState({...formState, warehouseId: e.target.value})}
                                                >
                                                    <option value="">{ct('select_placeholder')}</option>
                                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${formState.status === 'FULLY_RECEIVED' ? 'text-green-900' : 'text-blue-900'}`}>
                                                {formState.status === 'FULLY_RECEIVED' ? t('orders.form.stock_feed_title') : t('orders.form.order_mode_title')}
                                            </p>
                                            <p className={`text-[10px] font-bold uppercase leading-relaxed opacity-70 ${formState.status === 'FULLY_RECEIVED' ? 'text-green-700' : 'text-blue-700'}`}>
                                                {formState.status === 'FULLY_RECEIVED' 
                                                    ? t('orders.form.stock_feed_desc')
                                                    : t('orders.form.order_mode_desc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Standardized Footer */}
                        <div className="p-10 pt-4 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                                >
                                    {ct('cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-2 py-5 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <span>{ct('save')}</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
