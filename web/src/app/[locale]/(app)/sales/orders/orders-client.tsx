'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Plus, 
    Search, 
    ShoppingCart, 
    Truck, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle,
    Clock,
    FileText,
    MoreVertical,
    ArrowRight,
    Package,
    Loader2,
    Sparkles,
    Eye,
    Receipt,
    Calendar,
    BadgePercent,
    TrendingUp,
    TrendingDown,
    X,
    User
} from 'lucide-react';
import { toast } from 'sonner';
import { salesOrdersService, SalesOrder, ProfitabilityReport } from '@/services/sales-orders';
import { invoicesService } from '@/services/invoices';
import { customersService, Customer } from '@/services/customers';
import { productsService, Product } from '@/services/products';
import { formatCurrency } from '@/lib/formatters';
import { useParams } from 'next/navigation';

export function SalesOrdersClient() {
    const t = useTranslations('sales.orders');
    const ct = useTranslations('common');
    const { locale } = useParams();
    
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [profitability, setProfitability] = useState<ProfitabilityReport | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create Order state
    const [newOrder, setNewOrder] = useState({
        customerId: '',
        notes: '',
        lines: [] as any[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [ordersData, customersData, productsData] = await Promise.all([
                salesOrdersService.getAll(),
                customersService.getAll(),
                productsService.list()
            ]);
            setOrders(ordersData);
            setCustomers(customersData);
            setProducts((productsData as Product[]).filter((p: Product) => !(p as any).isBlocked));
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newOrder.lines.length === 0) {
            toast.error('Veuillez ajouter au moins une ligne.');
            return;
        }
        setIsSubmitting(true);
        try {
            await salesOrdersService.create(newOrder);
            toast.success(ct('toast.created'));
            setIsCreateModalOpen(false);
            setNewOrder({ customerId: '', notes: '', lines: [] });
            loadData();
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShipOrder = async (id: string) => {
        if (!confirm(t('ship_confirm'))) return;
        setIsSubmitting(true);
        try {
            await salesOrdersService.ship(id);
            toast.success('Livraison (BL) validée et stock décrémenté.');
            setIsDetailsOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateInvoice = async (id: string) => {
        if (!confirm(t('invoice_confirm'))) return;
        setIsSubmitting(true);
        try {
            // Default to CASH for now (triggers Stamp Duty in Algeria)
            await invoicesService.createFromSalesOrder(id, 'CASH');
            toast.success('Facture générée avec succès.');
            setIsDetailsOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openOrderDetails = async (order: SalesOrder) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
        setProfitability(null);
        try {
            const prof = await salesOrdersService.getProfitability(order.id);
            setProfitability(prof);
        } catch (err) {
            console.error('Failed to load profitability', err);
        }
    };

    const addLine = () => {
        setNewOrder({
            ...newOrder,
            lines: [...newOrder.lines, { productId: '', quantity: 1, unit: 'pcs', unitPriceHt: 0 }]
        });
    };

    const updateLine = (index: number, field: string, value: any) => {
        const updatedLines = [...newOrder.lines];
        updatedLines[index] = { ...updatedLines[index], [field]: value };
        
        // Auto-fill unit and price if product is selected
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                updatedLines[index].unit = product.unit;
                updatedLines[index].unitPriceHt = Number(product.salePriceHt);
            }
        }
        
        setNewOrder({ ...newOrder, lines: updatedLines });
    };

    const removeLine = (index: number) => {
        const updatedLines = newOrder.lines.filter((_, i) => i !== index);
        setNewOrder({ ...newOrder, lines: updatedLines });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'VALIDATED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'PREPARING': return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
            case 'SHIPPED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'INVOICED': return 'bg-emerald-600 text-white border-emerald-600';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredOrders = orders.filter(o => 
        o.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShoppingCart size={28} />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 font-medium ml-15">Pilotez votre cycle de vente, de la commande à la livraison.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all active:scale-95 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t('add')}
                </button>
            </header>

            {/* Quick Stats - Sales Focus */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Receipt size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Encours Ventes</p>
                            <p className="text-2xl font-black text-gray-900">{orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'INVOICED').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">CA Confirmé</p>
                            <p className="text-2xl font-black text-gray-900">
                                {formatCurrency(orders.filter(o => ['SHIPPED', 'INVOICED'].includes(o.status)).reduce((acc, o) => acc + Number(o.totalAmountHt), 0), locale as string)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Truck size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">En Préparation</p>
                            <p className="text-2xl font-black text-gray-900">{orders.filter(o => o.status === 'PREPARING').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Stock Critique</p>
                            <p className="text-2xl font-black text-rose-600">
                                {products.filter(p => Number(p.stockQuantity) <= Number(p.minStock)).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-12">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6 bg-gray-50/20">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('reference')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('customer')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('date')}</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant TTC</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{ct('loading')}</p>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-blue-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                                <FileText size={20} />
                                            </div>
                                            <p className="font-black text-gray-900">{order.reference}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{order.customer?.name}</p>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Compte Client</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar size={14} />
                                            <span className="text-[11px] font-bold">{new Date(order.date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-sm font-black text-gray-900">{formatCurrency(order.totalAmountTtc, locale as string)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                                                {t(`status.${order.status.toLowerCase()}`)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => openOrderDetails(order)}
                                                className="h-10 w-10 bg-white text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Order Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-8 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                                    <ShoppingCart className="text-blue-600" />
                                    {t('add')}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Saisie d'un nouveau Bon de Commande Client</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="h-12 w-12 bg-white text-gray-400 rounded-2xl flex items-center justify-center hover:text-rose-600 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('customer')}</label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                                        value={newOrder.customerId}
                                        onChange={e => setNewOrder({ ...newOrder, customerId: e.target.value })}
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Note / Instructions</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
                                        value={newOrder.notes}
                                        onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                                        placeholder="Note de livraison, spécifications..."
                                    />
                                </div>
                            </div>

                            {/* Lines Management */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Articles & Quantités</h3>
                                    <button 
                                        type="button"
                                        onClick={addLine}
                                        className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"
                                    >
                                        <Plus size={14} />
                                        Ajouter Article
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {newOrder.lines.map((line, idx) => (
                                        <div key={idx} className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100 flex items-center gap-4 group">
                                            <div className="flex-[2] space-y-1">
                                                <select
                                                    required
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm"
                                                    value={line.productId}
                                                    onChange={e => updateLine(idx, 'productId', e.target.value)}
                                                >
                                                    <option value="">Choisir un produit...</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.stockQuantity} dispos)</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-black text-sm text-center"
                                                    value={line.quantity}
                                                    onChange={e => updateLine(idx, 'quantity', Number(e.target.value))}
                                                    placeholder="Quantité"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="relative group/price">
                                                    <input
                                                        required
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full pl-9 pr-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-black text-sm text-blue-900"
                                                        value={line.unitPriceHt}
                                                        onChange={e => updateLine(idx, 'unitPriceHt', Number(e.target.value))}
                                                    />
                                                    <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                                                </div>
                                            </div>
                                            <button onClick={() => removeLine(idx)} className="h-10 w-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl flex items-center justify-center">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : ct('save')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Details & Profitability Drawer */}
            {isDetailsOpen && selectedOrder && (
                <div className="fixed inset-0 z-[110] flex justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                        <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{selectedOrder.reference}</h2>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Détails de la commande & Analyse</p>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="h-12 w-12 bg-white text-gray-400 rounded-2xl flex items-center justify-center hover:text-rose-600 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Summary Card */}
                            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total de la Vente (TTC)</p>
                                        <p className="text-4xl font-black leading-none">{formatCurrency(selectedOrder.totalAmountTtc, locale as string)}</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <span className={`px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md`}>
                                                {t(`status.${selectedOrder.status.toLowerCase()}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black uppercase tracking-tight">{selectedOrder.customer?.name}</p>
                                        <p className="text-[10px] font-bold opacity-60 mt-1">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Profitability Analytics */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-500" />
                                    {t('profitability.title')}
                                </h3>
                                
                                {profitability ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t('profitability.margin')}</p>
                                            <p className="text-2xl font-black text-emerald-900">{formatCurrency(profitability.totalMargin, locale as string)}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <TrendingUp size={16} className="text-emerald-500" />
                                                <span className="text-sm font-black text-emerald-600">{profitability.marginPercent.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('profitability.cost')}</p>
                                            <p className="text-2xl font-black text-gray-900">{formatCurrency(profitability.totalCost, locale as string)}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 italic">Basé sur PMP Production</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-3xl text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calcul de la rentabilité...</p>
                                    </div>
                                )}
                            </div>

                            {/* Lines Table */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('title')}</h3>
                                <div className="space-y-3">
                                    {selectedOrder.lines.map((line, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-sm uppercase">{line.product.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">Qté: {line.quantity} {line.unit} × {formatCurrency(line.unitPriceHt, locale as string)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-gray-900">{formatCurrency(line.lineTotalTtc, locale as string)}</p>
                                                {selectedOrder.status === 'SHIPPED' && (
                                                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-emerald-600 uppercase">
                                                        <CheckCircle2 size={10} />
                                                        Livré
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                            {selectedOrder.status === 'VALIDATED' || selectedOrder.status === 'PREPARING' ? (
                                <button
                                    onClick={() => handleShipOrder(selectedOrder.id)}
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <Truck size={24} />
                                            {t('ship')}
                                        </>
                                    )}
                                </button>
                            ) : selectedOrder.status === 'SHIPPED' ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-center gap-3 p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                                        <CheckCircle2 className="text-emerald-600" />
                                        <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Livraison validée le {new Date(selectedOrder.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCreateInvoice(selectedOrder.id)}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <Receipt size={24} />
                                                {t('invoice')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : selectedOrder.status === 'INVOICED' ? (
                                <div className="flex items-center justify-center gap-3 p-5 bg-blue-50 rounded-3xl border border-blue-100">
                                    <Receipt className="text-blue-600" />
                                    <p className="text-sm font-black text-blue-900 uppercase tracking-tight">{t('status.invoiced')}</p>
                                </div>
                            ) : null}
                            
                            {selectedOrder.status === 'INVOICED' && selectedOrder.invoice && (
                                <a 
                                    href={invoicesService.getInvoicePdfUrl(selectedOrder.invoice.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-white text-gray-600 rounded-[1.5rem] font-black border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <FileText size={18} />
                                    {t('view_invoice')} (PDF)
                                </a>
                            )}
                            
                            {selectedOrder.status !== 'INVOICED' && (
                                <button className="w-full py-4 bg-white text-gray-600 rounded-[1.5rem] font-black border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <Receipt size={18} />
                                    Télécharger Bon de Commande (PDF)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

