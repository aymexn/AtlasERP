'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Plus, Search, ShoppingCart, Truck, CheckCircle2, AlertTriangle,
    Clock, FileText, MoreVertical, ArrowRight, Package, Loader2,
    Sparkles, Eye, Receipt, Calendar, BadgePercent, TrendingUp,
    TrendingDown, X, User, RefreshCw, Download
} from 'lucide-react';
import { downloadPdf } from '@/lib/download-pdf';
import { toast } from 'sonner';
import { salesOrdersService, SalesOrder, ProfitabilityReport } from '@/services/sales-orders';
import { invoicesService } from '@/services/invoices';
import { customersService, Customer } from '@/services/customers';
import { productsService, Product } from '@/services/products';
import { formatCurrency } from '@/lib/format';
import { useParams } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';

export function SalesOrdersClient() {
    const t = useTranslations('sales.orders');
    const ct = useTranslations('common');
    const pt = useTranslations('products');
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
    const [isMounted, setIsMounted] = useState(false);

    // Create Order state
    const [newOrder, setNewOrder] = useState({
        customerId: '',
        notes: '',
        lines: [] as any[]
    });

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, customersData, productsData] = await Promise.all([
                salesOrdersService.getAll(),
                customersService.getAll(),
                productsService.list()
            ]);
            setOrders(ordersData || []);
            setCustomers(customersData || []);
            setProducts((productsData as Product[] || []).filter((p: Product) => !(p as any).isBlocked));
        } catch (err) {
            toast.error(ct('error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newOrder.lines.length === 0) {
            toast.error(t('errors.min_lines'));
            return;
        }
        setIsSubmitting(true);
        try {
            await salesOrdersService.create(newOrder);
            toast.success(ct('save_success'));
            setIsCreateModalOpen(false);
            setNewOrder({ customerId: '', notes: '', lines: [] });
            loadData();
        } catch (err) {
            toast.error(ct('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShipOrder = async (id: string) => {
        if (!confirm(ct('confirm'))) return;
        setIsSubmitting(true);
        try {
            await salesOrdersService.ship(id);
            toast.success(t('toast.shipped' as any)); // Existing toast keys might need adding to fr.json or I'll use common
            setIsDetailsOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || ct('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateInvoice = async (id: string) => {
        if (!confirm(ct('confirm'))) return;
        setIsSubmitting(true);
        try {
            await invoicesService.createFromSalesOrder(id, 'CASH');
            toast.success(t('toast.invoiced' as any));
            setIsDetailsOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || ct('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleValidateOrder = async (id: string) => {
        if (!confirm(ct('confirm'))) return;
        setIsSubmitting(true);
        try {
            await salesOrdersService.validate(id);
            toast.success(ct('save_success'));
            setIsDetailsOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || ct('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelOrder = async (id: string) => {
        if (!confirm(ct('delete_confirm'))) return;
        setIsSubmitting(true);
        try {
            await salesOrdersService.cancel(id);
            toast.success(ct('save_success'));
            setIsDetailsOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || ct('error'));
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

    const filteredOrders = useMemo(() => {
        return (orders || []).filter(order => 
            order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [orders, searchTerm]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-muted text-muted-foreground border-border';
            case 'VALIDATED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'PREPARING': return 'bg-warning/10 text-warning border-warning/20 animate-pulse';
            case 'SHIPPED': return 'bg-success/10 text-success border-success/20';
            case 'INVOICED': return 'bg-success text-success-foreground border-success';
            case 'CANCELLED': return 'bg-danger/10 text-danger border-danger/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const columns = [
        {
            header: t('reference'),
            accessor: (order: SalesOrder) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                        <FileText size={20} />
                    </div>
                    <div className="font-black text-foreground">{order.reference}</div>
                </div>
            )
        },
        {
            header: t('customer'),
            accessor: (order: SalesOrder) => (
                <div className="flex flex-col">
                    <div className="font-bold text-foreground uppercase text-[11px] tracking-tight">{order.customer?.name}</div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{ct('fields.customer')}</span>
                </div>
            )
        },
        {
            header: t('date'),
            accessor: (order: SalesOrder) => (
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={14} className="text-blue-400" />
                    <span className="text-[11px] font-bold">{new Date(order.date).toLocaleDateString(locale as string)}</span>
                </div>
            )
        },
        {
            header: t('total_ttc'),
            align: 'right' as const,
            className: "min-w-[140px] whitespace-nowrap",
            accessor: (order: SalesOrder) => (
                <div className="text-sm font-black text-gray-900 pr-4">{formatCurrency(order.totalAmountTtc)}</div>
            )
        },
        {
            header: t('status_label'),
            align: 'center' as const,
            accessor: (order: SalesOrder) => (
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                    {t(`status.${order.status.toLowerCase()}`)}
                </span>
            )
        },
        {
            header: t('fields.actions'),
            align: 'center' as const,
            accessor: (order: SalesOrder) => (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        openOrderDetails(order);
                    }}
                    className="h-10 w-10 bg-white text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                >
                    <Eye size={18} />
                </button>
            )
        }
    ];

    if (!isMounted || (loading && orders.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ct('loading')}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader 
                title={t('title')}
                subtitle={t('subtitle')}
                action={{
                    label: t('add'),
                    onClick: () => setIsCreateModalOpen(true),
                    icon: Plus
                }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title={t('kpi.pending_sales')} value={orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'INVOICED').length} icon={Receipt} variant="slate" type="count" loading={loading} />
                <KpiCard title={t('kpi.confirmed_ca')} value={orders.filter(o => ['SHIPPED', 'INVOICED'].includes(o.status)).reduce((acc, o) => acc + Number(o.totalAmountHt), 0)} icon={TrendingUp} variant="success" loading={loading} />
                <KpiCard title={t('title')} value={orders.length} icon={ShoppingCart} variant="primary" type="count" loading={loading} />
                <KpiCard title={t('kpi.critical_stock')} value={products.filter(p => Number(p.stockQuantity) <= Number(p.minStock)).length} icon={AlertTriangle} variant="danger" type="count" loading={loading} />
            </div>

            <div className="space-y-4">
                <div className="relative group max-w-md">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input type="text" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-4 bg-white border border-gray-100 rounded-4xl outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all font-bold shadow-sm" />
                </div>
                <DataTable data={filteredOrders} columns={columns} onRowClick={openOrderDetails} />
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-background/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border-8 border-card animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-8 bg-muted/50 flex items-center justify-between border-b border-border">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase flex items-center gap-3"><ShoppingCart className="text-primary" />{t('add')}</h2>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{t('add_subtitle')}</div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="h-12 w-12 bg-card text-muted-foreground rounded-2xl flex items-center justify-center hover:text-danger transition-colors shadow-sm"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest px-1">{t('customer')}</label>
                                    <select required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={newOrder.customerId} onChange={e => setNewOrder({ ...newOrder, customerId: e.target.value })}>
                                        <option value="">{t('select_customer')}</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest px-1">{t('notes')}</label>
                                    <input type="text" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold" value={newOrder.notes} onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} placeholder={ct('notes')} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{t('sections.items')}</h3>
                                    <button type="button" onClick={addLine} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"><Plus size={14} />{t('add_item')}</button>
                                </div>
                                <div className="space-y-3">
                                    {newOrder.lines.map((line, idx) => (
                                        <div key={idx} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4 group">
                                            <div className="flex-2 space-y-1">
                                                <select required className="w-full px-4 py-2.5 bg-card border border-border rounded-xl outline-none focus:border-primary font-bold text-sm" value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
                                                    <option value="">{t('select_product')}</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stockQuantity} dispos)</option>)}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <input required type="number" step="0.01" className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl outline-none focus:border-primary font-black text-sm text-center" value={line.quantity} onChange={e => updateLine(idx, 'quantity', Number(e.target.value))} placeholder="Quantité" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="relative group/price">
                                                    <input required type="number" step="0.01" className="w-full pl-9 pr-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl outline-none focus:bg-card focus:border-primary font-black text-sm text-primary" value={line.unitPriceHt} onChange={e => updateLine(idx, 'unitPriceHt', Number(e.target.value))} />
                                                    <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={14} />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeLine(idx)} className="h-10 w-10 text-danger opacity-40 hover:opacity-100 hover:bg-danger/10 transition-all rounded-xl flex items-center justify-center"><X size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-primary text-primary-foreground rounded-4xl font-black text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50">{isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : ct('save')}</button>
                        </form>
                    </div>
                </div>
            )}

            {isDetailsOpen && selectedOrder && (
                <div className="fixed inset-0 z-110 flex justify-end bg-background/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                        <div className="p-8 bg-muted border-b border-border flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-foreground tracking-tight uppercase">{selectedOrder.reference}</h2><div className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{t('title')}</div></div>
                            <button onClick={() => setIsDetailsOpen(false)} className="h-12 w-12 bg-card text-muted-foreground rounded-2xl flex items-center justify-center hover:text-danger transition-colors shadow-sm"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="bg-blue-600 p-8 rounded-4xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                                    <div className="relative z-10 flex justify-between items-start">
                                    <div><div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('total_ttc')}</div><div className="text-4xl font-black leading-none">{formatCurrency(selectedOrder.totalAmountTtc)}</div><div className="mt-4 flex gap-2"><span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">{t(`status.${selectedOrder.status.toLowerCase()}`)}</span><button onClick={() => downloadPdf(salesOrdersService.getPdfUrl(selectedOrder.id), `commande-${selectedOrder.reference}.pdf`)} className="px-4 py-1.5 bg-white text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"><Download size={14} />PDF</button><button onClick={() => downloadPdf(salesOrdersService.getDeliveryNoteUrl(selectedOrder.id), `bl-${selectedOrder.reference}.pdf`)} className="px-4 py-1.5 bg-blue-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2"><Truck size={14} />BL</button></div></div>
                                    <div className="text-right"><div className="text-sm font-black uppercase tracking-tight">{selectedOrder.customer?.name}</div><div className="text-[10px] font-bold opacity-60 mt-1">{new Date(selectedOrder.date).toLocaleDateString(locale as string)}</div></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-primary" />{t('profitability.title')}</h3>
                                {profitability ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50/50/50 p-6 rounded-3xl border border-blue-100/50"><div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t('profitability.margin')}</div><div className="text-2xl font-black text-slate-900">{formatCurrency(profitability.totalMargin)}</div><div className="flex items-center gap-2 mt-2"><TrendingUp size={16} className="text-primary" /><span className="text-sm font-black text-primary">{profitability.marginPercent.toFixed(1)}%</span></div></div>
                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100"><div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('profitability.cost')}</div><div className="text-2xl font-black text-gray-900">{formatCurrency(profitability.totalCost)}</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-2 italic">{t('profitability.pmp_note')}</div></div>
                                    </div>
                                ) : <div className="bg-gray-50 p-6 rounded-3xl text-center"><div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('profitability.calculating')}</div></div>}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('title')}</h3>
                                <div className="space-y-3">
                                    {selectedOrder.lines.map((line, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4"><div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Package size={20} /></div><div><div className="font-black text-gray-900 text-sm uppercase">{line.product.name}</div><div className="text-[10px] font-bold text-gray-400">{ct('fields.quantity')}: {line.quantity} {line.unit} × {formatCurrency(line.unitPriceHt)}</div></div></div>
                                            <div className="text-right"><div className="font-black text-gray-900">{formatCurrency(line.lineTotalTtc)}</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                            {selectedOrder.status === 'DRAFT' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleValidateOrder(selectedOrder.id)} disabled={isSubmitting} className="flex-1 py-5 bg-primary text-white rounded-4xl font-black text-lg shadow-xl shadow-blue-100/50 hover:bg-blue-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} />{ct('confirm')}</>}
                                    </button>
                                    <button onClick={() => handleCancelOrder(selectedOrder.id)} disabled={isSubmitting} className="px-8 py-5 bg-white text-danger border border-danger/10 rounded-4xl font-black text-lg hover:bg-danger/5 transition-all active:scale-95 flex items-center justify-center gap-3">
                                        <X size={24} />
                                    </button>
                                </div>
                            )}

                            {(selectedOrder.status === 'VALIDATED' || selectedOrder.status === 'PREPARING') && (
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => handleShipOrder(selectedOrder.id)} disabled={isSubmitting} className="w-full py-5 bg-primary text-white rounded-4xl font-black text-lg shadow-xl shadow-blue-100/50 hover:bg-blue-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Truck size={24} />{t('ship')}</>}
                                    </button>
                                    <button onClick={() => handleCancelOrder(selectedOrder.id)} disabled={isSubmitting} className="w-full py-3 bg-transparent text-danger/60 hover:text-danger rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                                        {t('cancel_order' as any) || ct('cancel')}
                                    </button>
                                </div>
                            )}
                            
                            {selectedOrder.status === 'SHIPPED' && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-center gap-3 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50"><CheckCircle2 className="text-primary" /><div className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('delivery_validated')} {new Date(selectedOrder.updatedAt).toLocaleDateString(locale as string)}</div></div>
                                    <button onClick={() => handleCreateInvoice(selectedOrder.id)} disabled={isSubmitting} className="w-full py-5 bg-blue-600 text-white rounded-4xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3">{isSubmitting ? <Loader2 className="animate-spin" /> : <><Receipt size={24} />{t('invoice')}</>}</button>
                                </div>
                            )}

                            {selectedOrder.status === 'INVOICED' && (
                                <div className="flex items-center justify-center gap-3 p-5 bg-blue-50 rounded-3xl border border-blue-100"><Receipt className="text-blue-600" /><div className="text-sm font-black text-blue-900 uppercase tracking-tight">{t('status.invoiced')}</div></div>
                            )}

                            {selectedOrder.status === 'CANCELLED' && (
                                <div className="flex items-center justify-center gap-3 p-5 bg-red-50 rounded-3xl border border-red-100"><X className="text-red-600" /><div className="text-sm font-black text-red-900 uppercase tracking-tight">{t('status.cancelled')}</div></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
