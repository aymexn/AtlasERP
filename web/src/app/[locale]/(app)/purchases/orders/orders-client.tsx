'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    ShoppingBag, Plus, Search, Filter, Loader2, Edit2, 
    Trash2, CheckCircle2, X, ChevronRight, FileText, 
    Truck, Send, Ban, History, Calculator, ArrowRight,
    Package, User, Calendar, Receipt, Info, PlusCircle, MinusCircle
} from 'lucide-react';
import { purchasesService, PurchaseOrder, PurchaseOrderStatus } from '@/services/purchases';
import { suppliersService, Supplier } from '@/services/suppliers';
import { productsService, Product } from '@/services/products';
import { inventoryService, Warehouse } from '@/services/inventory';
import { toast } from 'sonner';

function formatCurrency(amount: number, locale: string = 'fr') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 2
    }).format(amount);
}

export default function OrdersClient() {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [newOrder, setNewOrder] = useState<any>({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: '',
        lines: [{ productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [o, s, p, w] = await Promise.all([
                purchasesService.getAllOrders(),
                suppliersService.getAll(),
                productsService.list(),
                inventoryService.listWarehouses()
            ]);
            setOrders(o);
            setSuppliers(s);
            setProducts(p);
            setWarehouses(w);
        } catch (error) {
            console.error(error);
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrder.supplierId || newOrder.lines.some((l: any) => !l.productId || l.quantity <= 0)) {
            toast.error(t('errors.missing_fields'));
            return;
        }
        try {
            setSubmitting(true);
            await purchasesService.createOrder(newOrder);
            toast.success(ct('toast.success'));
            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAction = async (id: string, action: 'confirm' | 'send' | 'cancel') => {
        try {
            setSubmitting(true);
            if (action === 'confirm') await purchasesService.confirmOrder(id);
            if (action === 'send') await purchasesService.sendOrder(id);
            if (action === 'cancel') {
                if (!window.confirm(ct('confirm'))) return;
                await purchasesService.cancelOrder(id);
            }
            toast.success(ct('toast.success'));
            const updated = await purchasesService.getOrderById(id);
            setSelectedOrder(updated);
            await loadData();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateReception = async (id: string) => {
        const whId = window.prompt('ID de l\'entrepôt de destination (Défaut: premier entrepôt)');
        const warehouseId = whId || warehouses[0]?.id;
        if (!warehouseId) {
            toast.error('Aucun entrepôt disponible.');
            return;
        }
        try {
            setSubmitting(true);
            const rec = await purchasesService.createReception(id, warehouseId);
            toast.success('Réception créée avec succès (Brouillon)');
            // Navigate to reception details? Or just refresh.
            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const addLine = () => {
        setNewOrder({
            ...newOrder,
            lines: [...newOrder.lines, { productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
        });
    };

    const removeLine = (index: number) => {
        const lines = [...newOrder.lines];
        lines.splice(index, 1);
        setNewOrder({ ...newOrder, lines });
    };

    const updateLine = (index: number, field: string, value: any) => {
        const lines = [...newOrder.lines];
        lines[index] = { ...lines[index], [field]: value };
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                lines[index].unit = product.unit;
                lines[index].unitPriceHt = Number(product.purchasePriceHt) || 0;
            }
        }
        setNewOrder({ ...newOrder, lines });
    };

    const calculateTotals = () => {
        let ht = 0;
        let tva = 0;
        newOrder.lines.forEach((l: any) => {
            const lineHt = Number(l.quantity) * Number(l.unitPriceHt);
            ht += lineHt;
            tva += lineHt * Number(l.taxRate);
        });
        return { ht, tva, ttc: ht + tva };
    };

    const totals = calculateTotals();

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'SENT': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'CONFIRMED': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'PARTIALLY_RECEIVED': return 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse';
            case 'RECEIVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100 text-opacity-50';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('orders')}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{t('procurement_center')}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setNewOrder({
                            supplierId: '',
                            orderDate: new Date().toISOString().split('T')[0],
                            expectedDate: '',
                            notes: '',
                            lines: [{ productId: '', quantity: 1, unit: 'U', unitPriceHt: 0, taxRate: 0.19 }]
                        });
                        setIsCreateMode(true);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-95 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t('new_order')}
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('active_orders'), value: orders.filter(o => !['RECEIVED', 'CANCELLED'].includes(o.status)).length, sub: 'In Progress', color: 'blue', icon: Truck },
                    { label: t('total_cost'), value: formatCurrency(orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + Number(o.totalTtc), 0), locale), sub: 'DZD Total', color: 'indigo', icon: Calculator },
                    { label: t('received'), value: orders.filter(o => o.status === 'RECEIVED').length, sub: 'Closed Orders', color: 'emerald', icon: CheckCircle2 },
                    { label: t('pending'), value: orders.filter(o => o.status === 'PARTIALLY_RECEIVED').length, sub: 'Shortage Risk', color: 'amber', icon: History }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`h-12 w-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-lg group-hover:shadow-${stat.color}-100 shadow-sm border border-${stat.color}-100/50`}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                    <p className={`text-[9px] font-bold text-${stat.color}-600/80 uppercase tracking-tighter leading-none`}>{stat.sub}</p>
                                </div>
                            </div>
                            <p className="text-3xl font-black text-gray-900 tracking-tighter truncate">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dashboard / Filter */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden shadow-gray-200/50">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6 bg-gray-50/20">
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
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        <button 
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            TOUT
                        </button>
                        {['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED'].map(s => (
                            <button 
                                key={s}
                                onClick={() => setStatusFilter(s as PurchaseOrderStatus)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {t(`status.${s.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('reference')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('supplier')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('order_date')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('status_label')}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">{t('total_ttc')}</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-blue-50/30 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600" onClick={() => { setSelectedOrder(o); setIsCreateMode(false); setIsModalOpen(true); }}>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col text-xs font-black text-gray-900 uppercase bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg w-fit group-hover:bg-white">{o.reference}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-gray-900 text-base group-hover:text-blue-600 transition-colors uppercase leading-tight">{o.supplier?.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest">{o._count?.lines} articles</div>
                                    </td>
                                    <td className="px-8 py-6 text-gray-500 font-medium">
                                        {new Date(o.orderDate).toLocaleDateString(locale)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${getStatusColor(o.status)}`}>
                                            {t(`status.${o.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-base font-black text-gray-900">{formatCurrency(Number(o.totalTtc), locale)}</div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{formatCurrency(Number(o.totalHt), locale)} HT</div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="h-10 w-10 bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-90 transition-all shadow-sm border border-gray-100 rounded-2xl group-hover:border-blue-600">
                                            <ChevronRight size={20} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Modal / Drawer */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className={`bg-white rounded-[3rem] w-full ${isCreateMode ? 'max-w-6xl' : 'max-w-4xl'} relative z-50 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300`}>
                        
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 ${isCreateMode ? 'bg-blue-600' : 'bg-gray-900'} text-white rounded-2xl flex items-center justify-center shadow-xl`}>
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                        {isCreateMode ? t('new_order') : selectedOrder?.reference}
                                    </h2>
                                    {!isCreateMode && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${getStatusColor(selectedOrder?.status || '')}`}>
                                                {t(`status.${selectedOrder?.status.toLowerCase()}`)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase ml-2">{selectedOrder?.supplier?.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-all p-3 bg-gray-50 rounded-2xl">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/10">
                            {isCreateMode ? (
                                <form onSubmit={handleCreateOrder} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                                        <div className="md:col-span-4 space-y-8">
                                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                                                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                                   <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div> Configuration
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('supplier')}</label>
                                                        <select
                                                            required
                                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                                            value={newOrder.supplierId}
                                                            onChange={(e) => setNewOrder({ ...newOrder, supplierId: e.target.value })}
                                                        >
                                                            <option value="">Sélectionner fournisseur</option>
                                                            {suppliers.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('order_date')}</label>
                                                        <input
                                                            required
                                                            type="date"
                                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                                            value={newOrder.orderDate}
                                                            onChange={(e) => setNewOrder({ ...newOrder, orderDate: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('expected_date')}</label>
                                                        <input
                                                            type="date"
                                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                                            value={newOrder.expectedDate}
                                                            onChange={(e) => setNewOrder({ ...newOrder, expectedDate: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-900 p-8 rounded-[2rem] text-white space-y-6 shadow-2xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Récapitulatif financier</p>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center opacity-60">
                                                        <span className="text-xs uppercase tracking-widest">Calculated HT</span>
                                                        <span className="font-bold">{formatCurrency(totals.ht, locale)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center opacity-60">
                                                        <span className="text-xs uppercase tracking-widest">TVA (19%)</span>
                                                        <span className="font-bold">{formatCurrency(totals.tva, locale)}</span>
                                                    </div>
                                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                                        <span className="text-xs uppercase tracking-[0.2em] font-black text-blue-400">Total TTC</span>
                                                        <span className="text-3xl font-black">{formatCurrency(totals.ttc, locale)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-8 space-y-6">
                                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                                                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Package size={18} className="text-blue-500" /> Articles commandés
                                                    </h3>
                                                    <button type="button" onClick={addLine} className="flex items-center gap-2 text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all">
                                                        <PlusCircle size={14} /> Ajouter article
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto max-h-[400px]">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-gray-50/50 sticky top-0 z-10 border-b border-gray-100">
                                                            <tr>
                                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Article</th>
                                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 w-32">Qty</th>
                                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 w-40">Prix HT</th>
                                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Total HT</th>
                                                                <th className="px-6 py-4"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {newOrder.lines.map((l: any, i: number) => (
                                                                <tr key={i}>
                                                                    <td className="px-6 py-4">
                                                                        <select
                                                                            required
                                                                            className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                                                                            value={l.productId}
                                                                            onChange={(e) => updateLine(i, 'productId', e.target.value)}
                                                                        >
                                                                            <option value="">Sélectionner...</option>
                                                                            {products.map(p => (
                                                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                                                            <input
                                                                                required
                                                                                type="number"
                                                                                className="w-full bg-transparent outline-none font-bold text-sm"
                                                                                value={l.quantity}
                                                                                onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                                                                            />
                                                                            <span className="text-[9px] font-black text-gray-400">{l.unit}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <input
                                                                            required
                                                                            type="number"
                                                                            className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                                                                            value={l.unitPriceHt}
                                                                            onChange={(e) => updateLine(i, 'unitPriceHt', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right font-black text-gray-900 text-sm">
                                                                        {formatCurrency(Number(l.quantity) * Number(l.unitPriceHt), locale)}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <button type="button" onClick={() => removeLine(i)} className="text-gray-300 hover:text-rose-500 transition-all p-1 hover:bg-rose-50 rounded-lg">
                                                                            <MinusCircle size={18} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes internes / Instructions</label>
                                                <textarea
                                                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-blue-500 shadow-sm font-medium text-sm"
                                                    rows={3}
                                                    value={newOrder.notes}
                                                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                                                    placeholder="Instructions pour le fournisseur ou notes de réception..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-10 border-t border-gray-100">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all">
                                            {ct('cancel')}
                                        </button>
                                        <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-20 py-5 rounded-3xl font-black shadow-2xl shadow-blue-100 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs">
                                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <>{t('new_order')}</>}
                                        </button>
                                    </div>
                                </form>
                            ) : selectedOrder && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3 text-blue-600">
                                                <Info size={18} />
                                                <h3 className="text-xs font-black uppercase tracking-widest">Informations</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Fournisseur</p>
                                                    <p className="text-base font-black text-gray-900 uppercase mt-1 flex items-center gap-2">
                                                        <User size={16} className="text-gray-300" /> {selectedOrder.supplier?.name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Date Commande</p>
                                                    <p className="text-base font-bold text-gray-700 mt-1 flex items-center gap-2">
                                                        <Calendar size={16} className="text-gray-300" /> {new Date(selectedOrder.orderDate).toLocaleDateString(locale)}
                                                    </p>
                                                </div>
                                                {selectedOrder.expectedDate && (
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Date Livraison Attendue</p>
                                                        <p className="text-base font-bold text-gray-700 mt-1 flex items-center gap-2">
                                                            <Truck size={16} className="text-indigo-400" /> {new Date(selectedOrder.expectedDate).toLocaleDateString(locale)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-900 p-8 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                                                    <Receipt size={16} className="text-blue-400" /> Facturation
                                                </p>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center opacity-60 text-xs">
                                                        <span>TOTAL HT</span>
                                                        <span className="font-bold">{formatCurrency(Number(selectedOrder.totalHt), locale)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center opacity-60 text-xs">
                                                        <span>TOTAL TVA</span>
                                                        <span className="font-bold">{formatCurrency(Number(selectedOrder.totalTva), locale)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-8 border-t border-white/10">
                                                <p className="text-4xl font-black tracking-tighter">{formatCurrency(Number(selectedOrder.totalTtc), locale)}</p>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2 leading-none">Net à payer TTC</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-amber-500">
                                                    <History size={18} />
                                                    <h3 className="text-xs font-black uppercase tracking-widest">Suivi Réceptions</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {selectedOrder._count?.stockReceptions === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-4 opacity-30 grayscale">
                                                            <Truck size={32} className="mb-2" />
                                                            <p className="text-[8px] font-black uppercase tracking-widest">Aucune réception</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                                            <div className="h-10 w-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                                                <Truck size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-emerald-900">{selectedOrder._count?.stockReceptions} Réception(s)</p>
                                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Journal des arrivées</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedOrder.status !== 'CANCELLED' && (
                                                <button 
                                                    onClick={() => handleCreateReception(selectedOrder.id)}
                                                    disabled={!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(selectedOrder.status)}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-0 disabled:pointer-events-none text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-100 flex items-center justify-center gap-3"
                                                >
                                                    <ArrowRight size={18} /> Créer réception
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 underline underline-offset-8 decoration-2 decoration-blue-500/30">
                                                Lignes du bon de commande
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-white border-b border-gray-50">
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Article</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Qté Commandée</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Qté Reçue</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">% Progression</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Prix Unitaire HT</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {selectedOrder.lines?.map((line) => {
                                                        const progress = Math.min(100, (Number(line.receivedQty) / Number(line.quantity)) * 100);
                                                        return (
                                                            <tr key={line.id} className="group hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-8 py-6">
                                                                    <div className="font-black text-gray-900 text-sm">{line.product?.name}</div>
                                                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100 w-fit">{line.product?.sku}</div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-baseline gap-1.5 font-black text-gray-900 text-base">
                                                                        {line.quantity} <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{line.unit}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 font-black text-indigo-600 text-base">
                                                                    {line.receivedQty} <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{line.unit}</span>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex flex-col gap-2 w-32">
                                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                                                                        </div>
                                                                        <span className={`text-[10px] font-black ${progress === 100 ? 'text-emerald-600' : 'text-indigo-400'}`}>{progress.toFixed(0)}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-right font-black text-gray-900 text-sm">
                                                                    {formatCurrency(Number(line.unitPriceHt), locale)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Detailed Action Bar */}
                                    <div className="pt-10 border-t border-gray-100 flex items-center justify-between shrink-0 mb-4 sticky bottom-0 bg-white z-20">
                                        <button
                                            onClick={() => handleAction(selectedOrder.id, 'cancel')}
                                            disabled={['RECEIVED', 'CANCELLED'].includes(selectedOrder.status)}
                                            className="px-10 py-5 rounded-2xl text-rose-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                                        >
                                            <Ban size={20} className="inline mr-2" /> Annuler Bon
                                        </button>
                                        
                                        <div className="flex items-center gap-4">
                                            {selectedOrder.status === 'DRAFT' && (
                                                <button 
                                                    onClick={() => handleAction(selectedOrder.id, 'confirm')} 
                                                    className="px-12 py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-3xl font-black shadow-2xl shadow-amber-100 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs active:scale-95"
                                                >
                                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Confirmer CDO</>}
                                                </button>
                                            )}
                                            {selectedOrder.status === 'CONFIRMED' && (
                                                <button 
                                                    onClick={() => handleAction(selectedOrder.id, 'send')} 
                                                    className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black shadow-2xl shadow-blue-100 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs active:scale-95"
                                                >
                                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Envoyer Fournisseur</>}
                                                </button>
                                            )}
                                            {['RECEIVED', 'CANCELLED', 'PARTIALLY_RECEIVED', 'SENT'].includes(selectedOrder.status) && (
                                                <button 
                                                    onClick={() => setIsModalOpen(false)} 
                                                    className="px-12 py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-black shadow-2xl shadow-gray-200 transition-all uppercase tracking-[0.2em] text-xs active:scale-95"
                                                >
                                                    Fermer la vue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
