'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    ShoppingBag, Search, Plus, Loader2, X,
    Calendar, Calculator, ShoppingCart, Info, 
    Package, ArrowLeft, Save, Trash2, Truck, Warehouse,
    CheckCircle2, Users, Receipt, AlertCircle, TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Supplier } from '@/services/suppliers';
import { Product } from '@/services/products';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { apiFetch } from '@/lib/api';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderLineForm {
    productId: string;
    quantity: number | string;
    unit: string;
    unitPriceHt: number | string;
    taxRate: number;
    note?: string;
}

interface OrderForm {
    supplierId: string;
    orderDate: string;
    expectedDate: string;
    notes: string;
    status: string;
    warehouseId?: string;
    lines: OrderLineForm[];
}

interface OrderFormClientProps {
    id?: string;
}

export default function OrderFormClient({ id }: OrderFormClientProps) {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'items' | 'summary'>('general');
    
    const [formState, setFormState] = useState<OrderForm>({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: '',
        status: 'DRAFT',
        warehouseId: '',
        lines: [{ productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [suppliersData, productsData, warehousesData] = await Promise.all([
                apiFetch('/suppliers'),
                apiFetch('/products'),
                apiFetch('/warehouses')
            ]);
            
            const suppliersList = Array.isArray(suppliersData) ? suppliersData : suppliersData.data ?? [];
            const productsList = Array.isArray(productsData) ? productsData : productsData.data ?? [];
            const warehousesList = Array.isArray(warehousesData) ? warehousesData : warehousesData.data ?? [];

            setSuppliers(suppliersList);
            setAvailableProducts(productsList);
            setWarehouses(warehousesList);
            
            if (id) {
                const orderData = await apiFetch(`/purchase-orders/${id}`);
                setFormState({
                    supplierId: orderData.supplierId,
                    orderDate: new Date(orderData.orderDate).toISOString().split('T')[0],
                    expectedDate: orderData.expectedDate ? new Date(orderData.expectedDate).toISOString().split('T')[0] : '',
                    notes: orderData.notes || '',
                    status: orderData.status,
                    warehouseId: orderData.warehouseId || (warehousesList.length > 0 ? warehousesList[0].id : ''),
                    lines: orderData.lines.map((l: any) => ({
                        productId: l.productId,
                        quantity: l.quantity,
                        unit: l.unit,
                        unitPriceHt: l.unitPriceHt,
                        taxRate: l.taxRate,
                        note: l.note
                    }))
                });
            } else if (warehousesList.length > 0) {
                setFormState(prev => ({ ...prev, warehouseId: warehousesList[0].id }));
            }
        } catch (err) {
            console.error('[OrderForm] Failed to load data:', err);
            toast.error(ct('errors.fetch_failed' as any));
        } finally {
            setLoading(false);
        }
    };

    const updateLine = (index: number, field: string, value: any) => {
        const lines = [...formState.lines];
        lines[index] = { ...lines[index], [field]: value };
        
        if (field === 'productId') {
            const product = availableProducts.find(p => p.id === value);
            if (product) {
                lines[index].unit = product.unit || 'U';
                lines[index].unitPriceHt = product.purchasePriceHt !== null ? Number(product.purchasePriceHt) : 0;
                toast.success(`${product.name} sélectionné`);
            }
        }
        setFormState({ ...formState, lines });
    };

    const addLine = () => {
        setFormState({
            ...formState,
            lines: [...formState.lines, { productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
        });
    };

    const removeLine = (index: number) => {
        if (formState.lines.length === 1) return;
        setFormState({
            ...formState,
            lines: formState.lines.filter((_, i) => i !== index)
        });
    };

    const totals = useMemo(() => {
        let ht = 0;
        let tva = 0;
        formState.lines.forEach(l => {
            const lineHt = Number(l.quantity || 0) * Number(l.unitPriceHt || 0);
            ht += lineHt;
            tva += lineHt * Number(l.taxRate || 0);
        });
        return { ht, tva, ttc: ht + tva };
    }, [formState.lines]);

    const handleSubmit = async () => {
        if (!formState.supplierId) {
            toast.error(t('orders.errors.no_supplier' as any));
            setActiveTab('general');
            return;
        }
        if (formState.lines.some(l => !l.productId || Number(l.quantity) <= 0)) {
            toast.error(t('orders.errors.invalid_lines' as any));
            setActiveTab('items');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formState,
                lines: formState.lines.map(l => ({
                    ...l,
                    quantity: Number(l.quantity),
                    unitPriceHt: Number(l.unitPriceHt)
                }))
            };

            if (id) {
                await apiFetch(`/purchase-orders/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                toast.success(ct('save_success'));
                router.push(`/${locale}/purchases/orders/${id}`);
            } else {
                const result = await apiFetch('/purchase-orders', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast.success(t('orders.success.created' as any));
                router.push(`/${locale}/purchases/orders/${result.id}`);
            }
        } catch (err: any) {
            toast.error(err.message || ct('errors.submit_failed' as any));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-100 transition-all active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                            {id ? t('orders.edit') : t('orders.add')}
                        </h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {id ? t('orders.edit_subtitle') : t('orders.add_subtitle')}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        {ct('cancel')}
                    </button>
                    <button 
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {t('orders.form.save')}
                    </button>
                </div>
            </div>

            {/* Wizard Tabs */}
            <div className="flex gap-4 mb-8 bg-slate-100/50 p-2 rounded-3xl w-fit">
                {[
                    { id: 'general', label: t('orders.tabs.general'), icon: Info },
                    { id: 'items', label: t('orders.tabs.items'), icon: Package },
                    { id: 'summary', label: t('orders.tabs.summary'), icon: Calculator },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'general' && (
                        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] overflow-hidden bg-white p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    {t('orders.form.supplier')}
                                </label>
                                <Combobox 
                                    options={suppliers.map(s => ({ 
                                        label: `${s.name}`, 
                                        value: s.id,
                                        sub: `${s.nif ? 'NIF: ' + s.nif : ''} ${s.rc ? '| RC: ' + s.rc : ''}`.trim()
                                    }))}
                                    value={formState.supplierId}
                                    onChange={(val) => setFormState({ ...formState, supplierId: val })}
                                    placeholder={t('suppliers.new_supplier')}
                                    icon={Users}
                                />
                                {formState.supplierId && (
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                                        {(() => {
                                            const s = suppliers.find(sup => sup.id === formState.supplierId);
                                            return s ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Raison Sociale</p>
                                                        <p className="font-black text-slate-900">{s.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email / Contact</p>
                                                        <p className="font-bold text-slate-600 text-sm">{s.email || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2 pt-2 border-t border-slate-200/50 flex gap-4">
                                                        <Badge variant="outline" className="bg-white">{s.nif ? `NIF: ${s.nif}` : 'No NIF'}</Badge>
                                                        <Badge variant="outline" className="bg-white">{s.rc ? `RC: ${s.rc}` : 'No RC'}</Badge>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        {t('orders.form.order_date')}
                                    </label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                                        <input 
                                            type="date"
                                            value={formState.orderDate}
                                            onChange={(e) => setFormState({ ...formState, orderDate: e.target.value })}
                                            className="w-full h-14 pl-16 pr-6 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-slate-900 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        {t('orders.form.expected_date')}
                                    </label>
                                    <div className="relative group">
                                        <Truck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                                        <input 
                                            type="date"
                                            value={formState.expectedDate}
                                            onChange={(e) => setFormState({ ...formState, expectedDate: e.target.value })}
                                            className="w-full h-14 pl-16 pr-6 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-slate-900 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    {t('orders.form.notes')}
                                </label>
                                <textarea 
                                    value={formState.notes}
                                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                                    className="w-full min-h-[150px] p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 shadow-sm resize-none"
                                    placeholder="Add any specific instructions or terms..."
                                />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'items' && (
                        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] overflow-hidden bg-white p-8">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                    <Package className="text-blue-600" />
                                    {t('orders.form.items_title')}
                                </h3>
                                <button 
                                    onClick={addLine}
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl px-6 py-2 h-auto text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-none transition-all active:scale-95"
                                >
                                    <Plus size={14} /> {t('orders.form.add_line')}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formState.lines.map((line, index) => (
                                    <div key={index} className="group relative bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                            <div className="md:col-span-5 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Product / SKU</label>
                                                <Combobox 
                                                    options={availableProducts.map(p => ({ 
                                                        label: p.name, 
                                                        value: p.id,
                                                        sub: p.sku || 'No SKU'
                                                    }))}
                                                    value={line.productId}
                                                    onChange={(val) => updateLine(index, 'productId', val)}
                                                    placeholder={t('orders.form.product_placeholder')}
                                                    className="h-12 rounded-2xl"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Qty ({line.unit})</label>
                                                <input 
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 transition-all font-black text-slate-900 text-center"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Price HT</label>
                                                <input 
                                                    type="number"
                                                    value={line.unitPriceHt}
                                                    onChange={(e) => updateLine(index, 'unitPriceHt', e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 transition-all font-black text-slate-900 text-right"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2 flex flex-col items-end pb-3 pr-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1">Subtotal HT</label>
                                                <span className="text-sm font-black text-slate-900">
                                                    {formatCurrency(Number(line.quantity || 0) * Number(line.unitPriceHt || 0))}
                                                </span>
                                            </div>
                                            <div className="md:col-span-1 flex justify-center pb-2">
                                                <button 
                                                    onClick={() => removeLine(index)}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'summary' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-white p-10 flex flex-col justify-center items-center text-center space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                                        <Receipt size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">{t('orders.title')}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                            {t('orders.add_subtitle')}
                                        </p>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-slate-900 p-10 text-white space-y-8 relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                                    <div className="relative z-10">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8">{t('orders.form.financial_summary')}</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center opacity-60">
                                                <span className="text-xs font-bold uppercase tracking-widest">Subtotal HT</span>
                                                <span className="text-lg font-black">{formatCurrency(totals.ht)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-blue-400">
                                                <span className="text-xs font-bold uppercase tracking-widest">VAT (19%)</span>
                                                <span className="text-lg font-black">+{formatCurrency(totals.tva)}</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-6" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black uppercase tracking-widest text-primary">Total TTC</span>
                                                <span className="text-4xl font-black tracking-tighter">{formatCurrency(totals.ttc)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-white p-10 space-y-8">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <AlertCircle size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase">{t('orders.form.direct_stock')}</h4>
                                        <p className="text-sm font-bold text-slate-500 leading-relaxed mt-2">
                                            {t('receptions.details.validation_warning')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${formState.status === 'FULLY_RECEIVED' ? 'bg-green-600 text-white shadow-green-100' : 'bg-white text-slate-300'}`}>
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{t('orders.form.stock_feed_title')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('orders.form.direct_stock_desc')}</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormState({...formState, status: formState.status === 'FULLY_RECEIVED' ? 'DRAFT' : 'FULLY_RECEIVED'})}
                                        className={`w-16 h-9 rounded-full p-1.5 transition-all flex items-center ${formState.status === 'FULLY_RECEIVED' ? 'bg-green-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all transform ${formState.status === 'FULLY_RECEIVED' ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {formState.status === 'FULLY_RECEIVED' && (
                                    <div className="pt-6 animate-in slide-in-from-top-4 duration-300 space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                                            {t('receptions.fields.warehouse')}
                                        </label>
                                        <select 
                                            className="w-full h-14 px-6 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-green-600 focus:bg-white transition-all font-black text-slate-900 text-sm shadow-sm"
                                            value={formState.warehouseId}
                                            onChange={(e) => setFormState({...formState, warehouseId: e.target.value})}
                                        >
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>

                {/* Sidebar Info/Status */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-white p-8">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">{ct('progress' as any)}</h3>
                        <div className="space-y-6">
                            {[
                                { step: 'general', label: t('orders.tabs.general'), status: formState.supplierId ? 'done' : 'current' },
                                { step: 'items', label: t('orders.tabs.items'), status: formState.lines.some(l => l.productId) ? 'done' : 'pending' },
                                { step: 'summary', label: t('orders.tabs.summary'), status: 'pending' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                                        s.status === 'done' ? 'bg-green-100 text-green-600' : 
                                        s.status === 'current' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-300'
                                    }`}>
                                        {s.status === 'done' ? <CheckCircle2 size={16} /> : i + 1}
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-tight ${
                                        s.status === 'pending' ? 'text-slate-300' : 'text-slate-700'
                                    }`}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <TrendingUp size={28} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black tracking-tighter">Inventory Insights</h4>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-2 leading-relaxed">
                                    Real-time tracking of stock movements ensures accurate planning and avoids stockouts.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
