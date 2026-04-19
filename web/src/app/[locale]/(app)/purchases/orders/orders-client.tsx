'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    ShoppingBag, Search, Plus, Loader2, Edit2, Trash2, 
    ArrowRight, Filter, FileText, Download, CheckCircle2, X,
    Calendar, TrendingUp, AlertTriangle, Info, Package, MoreVertical,
    FileSearch, Truck, History, Calculator, ShoppingCart, LayoutGrid, Settings,
    Clock, Check, PackageSearch, MinusCircle, PlusCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'items' | 'summary'>('general');
    const [submitting, setSubmitting] = useState(false);
    
    interface OrderLineForm { productId: string; quantity: number | string; unit: string; unitPriceHt: number | string; taxRate: number }
    interface OrderForm { supplierId: string; orderDate: string; expectedDate: string; notes: string; lines: OrderLineForm[] }
    
    const [formState, setFormState] = useState<OrderForm>({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: '',
        lines: [{ productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
    });

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, suppliersData, productsData] = await Promise.all([
                apiFetch('/purchase-orders'),
                apiFetch('/suppliers'),
                apiFetch('/products')
            ]);
            setOrders(Array.isArray(ordersData) ? ordersData : ordersData.data ?? []);
            setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data ?? []);
            setAvailableProducts(Array.isArray(productsData) ? productsData : productsData.data ?? []);
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
            
            toast.success(t('orders.success.created' as any) || 'BCF créé avec succès');
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
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
                lines[index].unitPriceHt = Number(product.purchasePriceHt) || 0;
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
            case 'RECEIVED': return 'active';
            case 'CANCELLED': return 'inactive';
            case 'PARTIALLY_RECEIVED': return 'warning';
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
                    onClick: () => {
                        setFormState({
                            supplierId: '',
                            orderDate: new Date().toISOString().split('T')[0],
                            expectedDate: '',
                            notes: '',
                            lines: [{ productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
                        });
                        setActiveTab('general');
                        setIsModalOpen(true);
                    },
                    icon: Plus
                }}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <KpiCard 
                    title={t('orders.kpi.active_orders')}
                    value={orders.filter(o => !['RECEIVED', 'CANCELLED'].includes(o.status)).length}
                    icon={Truck}
                    variant="primary"
                    type="count"
                />
                <KpiCard 
                    title={t('orders.kpi.total_cost')}
                    value={orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + Number(o.totalTtc), 0)}
                    icon={Calculator}
                    variant="info"
                    type="currency"
                />
                <KpiCard 
                    title={t('orders.kpi.received')}
                    value={orders.filter(o => o.status === 'RECEIVED').length}
                    icon={CheckCircle2}
                    variant="success"
                    type="count"
                />
                <KpiCard 
                    title={t('orders.kpi.pending')}
                    value={orders.filter(o => o.status === 'PARTIALLY_RECEIVED').length}
                    icon={Clock}
                    variant="warning"
                    type="count"
                />
            </div>

            {/* Main Table */}
            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
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
                                        {row.status}
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
                    <div className={`bg-white rounded-4xl w-full ${activeTab === 'items' ? 'max-w-6xl' : 'max-w-2xl'} relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all border border-slate-100`}>
                        {/* Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {t('orders.add')}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                    {t('orders.add_subtitle')}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-8 mt-4 gap-6 border-b border-slate-50 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'general', label: ct('general_info' as any) || "Général", icon: Info },
                                { id: 'items', label: t('orders.form.items_title' as any) || "Articles", icon: Package },
                                { id: 'summary', label: t('orders.form.summary_title' as any) || "Récapitulatif", icon: Calculator },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 border-b-2 transition-all font-bold text-sm whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('orders.form.supplier' as any) || 'Fournisseur'}</label>
                                            <select 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={formState.supplierId}
                                                onChange={(e) => setFormState({ ...formState, supplierId: e.target.value })}
                                            >
                                                <option value="">{ct('select_placeholder' as any) || 'Sélectionner...'}</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('orders.form.order_date' as any) || 'Date émission'}</label>
                                            <input 
                                                type="date"
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={formState.orderDate}
                                                onChange={(e) => setFormState({ ...formState, orderDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('orders.form.expected_date' as any) || 'Livraison prévue'}</label>
                                            <input 
                                                type="date"
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={formState.expectedDate}
                                                onChange={(e) => setFormState({ ...formState, expectedDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('orders.form.notes' as any) || 'Notes'}</label>
                                            <textarea 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900 min-h-[100px]"
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
                                        {formState.lines.map((l, i) => (
                                            <div key={i} className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
                                                <div className="flex-1 min-w-[300px]">
                                                    <select 
                                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-bold text-slate-800 text-sm"
                                                        value={l.productId}
                                                        onChange={(e) => updateLine(i, 'productId', e.target.value)}
                                                    >
                                                        <option value="">{t('orders.form.product_placeholder' as any) || 'Sélectionner un article...'}</option>
                                                        {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || 'N/A'})</option>)}
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-28">
                                                    <input 
                                                        type="number"
                                                        placeholder="Qté"
                                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-black text-slate-800 text-center"
                                                        value={l.quantity}
                                                        onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-full md:w-40">
                                                    <input 
                                                        type="number"
                                                        placeholder="P.U HT"
                                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-black text-slate-800 text-right"
                                                        value={l.unitPriceHt}
                                                        onChange={(e) => updateLine(i, 'unitPriceHt', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-full md:w-11 flex items-center">
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
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Récapitulatif Financier</h3>
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
                                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                                        <Info className="text-amber-500 mt-1" size={20} />
                                        <p className="text-xs font-bold text-amber-700 leading-relaxed uppercase">
                                            Veuillez vérifier les quantités et les prix avant de valider. Ce BCF sera envoyé au statut "BROUILLON" par défaut.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                {ct('cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> {t('orders.form.save' as any) || 'Enregistrer'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
