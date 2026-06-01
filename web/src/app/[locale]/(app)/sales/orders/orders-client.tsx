'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Plus, Search, ShoppingCart, Truck, CheckCircle2, AlertTriangle,
    Clock, FileText, Loader2, Eye, Receipt, Calendar, TrendingUp,
    TrendingDown, X, Download, Filter, ChevronRight, Package,
    BadgePercent, RotateCcw, Ban, ArrowRight, Info, Pencil
} from 'lucide-react';
import { downloadPdf } from '@/lib/download-pdf';
import { toast } from 'sonner';
import { salesOrdersService, SalesOrder, CreateOrderInput } from '@/services/sales-orders';
import { customersService, Customer } from '@/services/customers';
import { productsService, Product } from '@/services/products';
import { invoicesService } from '@/services/invoices';
import { dashboardService } from '@/services/dashboard';
import { ProductCombobox } from '@/components/ui/product-combobox';
import { ProductSelect } from '@/components/ui/ProductSelect';
import { formatCurrency } from '@/lib/format';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OrderLineEditor } from '@/components/orders/OrderLineEditor';

const TVA = 0.19;

type StepId = 'info' | 'lines' | 'summary';

const STATUS_META: Record<string, { label: string; color: string; badge: string }> = {
    DRAFT:     { label: 'Brouillon',    color: 'bg-slate-100 text-slate-600 border-slate-200', badge: 'default' },
    CONFIRMED: { label: 'Confirmé',     color: 'bg-blue-50 text-blue-600 border-blue-100', badge: 'primary' },
    VALIDATED: { label: 'Validé',       color: 'bg-indigo-50 text-indigo-700 border-indigo-100', badge: 'primary' },
    PREPARING: { label: 'Préparation',  color: 'bg-amber-50 text-amber-700 border-amber-100', badge: 'warning' },
    SHIPPED:   { label: 'Expédié',      color: 'bg-emerald-50 text-emerald-700 border-emerald-100', badge: 'active' },
    INVOICED:  { label: 'Facturé',      color: 'bg-blue-600 text-white border-blue-700', badge: 'primary' },
    CANCELLED: { label: 'Annulé',       color: 'bg-red-50 text-red-600 border-red-100', badge: 'danger' },
};

function getMarginColor(pct: number) {
    if (pct >= 30) return 'text-emerald-600 bg-emerald-50';
    if (pct >= 15) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
}

export function SalesOrdersClient() {
    const t = useTranslations('sales.orders');
    const ct = useTranslations('common');
    const { locale } = useParams() as { locale: string };

    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<any>(null);

    // Filters
    const [filters, setFilters] = useState({ status: '', customerId: '', search: '', dateFrom: '', dateTo: '' });
    const [activeStatus, setActiveStatus] = useState<string>('');

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Create form — 3-step
    const [step, setStep] = useState<StepId>('info');
    const [newOrder, setNewOrder] = useState<CreateOrderInput>({
        customerId: '', dueDate: '', notes: '', internalNotes: '',
        shippingCost: 0, discountPercent: 0, lines: []
    });

    useEffect(() => { setIsMounted(true); loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [ordersData, customersData, productsData, kpisData] = await Promise.all([
                salesOrdersService.getAll(),
                customersService.getAll(),
                productsService.list({ type: 'FINISHED_GOOD' }),
                dashboardService.getSalesKpis().catch(() => ({ data: null })),
            ]);
            setOrders(ordersData || []);
            setCustomers(customersData || []);
            setProducts((productsData as Product[] || []).filter((p: any) => p.isActive && !p.isBlocked));
            setKpis(kpisData?.data || null);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const loadKpis = async () => {
        try {
            const res = await dashboardService.getSalesKpis();
            setKpis(res?.data || null);
        } catch {}
    };

    // ── Form helpers ───────────────────────────────────────────
    const addLine = () => setNewOrder(o => ({
        ...o, lines: [...o.lines, { productId: '', quantity: 1, unitPriceHt: 0, discountPercent: 0 }]
    }));

    const updateLine = (idx: number, field: string, value: any) => {
        const lines = [...newOrder.lines];
        lines[idx] = { ...lines[idx], [field]: value };
        if (field === 'productId') {
            const p = products.find(p => p.id === value);
            if (p) lines[idx].unitPriceHt = Number(p.salePriceHt || 0);
        }
        setNewOrder(o => ({ ...o, lines }));
    };

    const removeLine = (idx: number) =>
        setNewOrder(o => ({ ...o, lines: o.lines.filter((_, i) => i !== idx) }));

    // Live totals
    const computed = useMemo(() => {
        const subtotalHt = newOrder.lines.reduce((sum, l) => {
            return sum + (Number(l.quantity) * Number(l.unitPriceHt)) * (1 - (Number(l.discountPercent) || 0) / 100);
        }, 0);
        const totalHt = subtotalHt * (1 - (Number(newOrder.discountPercent) || 0) / 100);
        const totalTva = totalHt * TVA;
        const totalTtc = totalHt + totalTva + (Number(newOrder.shippingCost) || 0);

        // Estimated margin
        const costTotal = newOrder.lines.reduce((sum, l) => {
            const p = products.find(p => p.id === l.productId);
            return sum + (Number(p?.standardCost || 0) * Number(l.quantity));
        }, 0);
        const margin = totalHt - costTotal;
        const marginPct = totalHt > 0 ? (margin / totalHt) * 100 : 0;
        return { subtotalHt, totalHt, totalTva, totalTtc, margin, marginPct };
    }, [newOrder, products]);

    // ── Handlers ───────────────────────────────────────────────
    const handleCreate = async (validate = false) => {
        if (!newOrder.customerId) { toast.error(t('select_customer') || 'Sélectionnez un client'); return; }
        if (newOrder.lines.length === 0) { toast.error(t('errors.min_lines') || 'Ajoutez au moins une ligne'); return; }
        if (newOrder.lines.some(l => !l.productId)) { toast.error(t('errors.invalid_lines' as any) || 'Chaque ligne doit avoir un produit'); return; }

        setIsSubmitting(true);
        try {
            const order = await salesOrdersService.create(newOrder);
            if (validate && order?.id) {
                await salesOrdersService.validate(order.id);
                toast.success('BC créé et validé — stock réservé');
            } else {
                toast.success('Brouillon BC créé');
            }
            setIsCreateOpen(false);
            resetForm();
            loadAll();
            loadKpis();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewOrder({ customerId: '', dueDate: '', notes: '', internalNotes: '', shippingCost: 0, discountPercent: 0, lines: [] });
        setStep('info');
    };

    const handleAction = async (action: 'validate' | 'ship' | 'cancel' | 'invoice', id: string) => {
        const confirmMsg: Record<string, string> = {
            validate: 'Valider ce BC et réserver le stock ?',
            ship: 'Marquer comme expédié et sortir du stock ?',
            cancel: 'Annuler ce bon de commande ?',
            invoice: 'Générer une facture depuis ce BC ?',
        };
        if (!confirm(confirmMsg[action])) return;
        setIsSubmitting(true);
        try {
            if (action === 'validate') await salesOrdersService.validate(id);
            else if (action === 'ship') await salesOrdersService.ship(id);
            else if (action === 'cancel') await salesOrdersService.cancel(id);
            else if (action === 'invoice') await invoicesService.createFromSalesOrder(id, 'CASH');
            toast.success('Action effectuée avec succès');
            setIsDetailOpen(false);
            loadAll();
            loadKpis();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDetail = async (order: SalesOrder) => {
        try {
            const full = await salesOrdersService.getOne(order.id);
            setSelectedOrder(full);
        } catch {
            setSelectedOrder(order);
        }
        setIsDetailOpen(true);
    };

    // ── Filtered list ───────────────────────────────────────────
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (activeStatus && o.status !== activeStatus) return false;
            if (filters.customerId && o.customerId !== filters.customerId) return false;
            if (filters.search && 
                !o.reference.toLowerCase().includes(filters.search.toLowerCase()) &&
                !o.customer?.name.toLowerCase().includes(filters.search.toLowerCase()))
                return false;
            return true;
        });
    }, [orders, activeStatus, filters]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
        return counts;
    }, [orders]);

    if (!isMounted || (loading && orders.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ct('loading')}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                action={{ label: t('add'), onClick: () => { resetForm(); setIsCreateOpen(true); }, icon: Plus }}
            />

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <KpiCard title={t('kpi.pending_sales') || 'BC OUVERTS'} value={kpis?.openOrders ?? orders.filter(o => ['DRAFT','VALIDATED','PREPARING','SHIPPED'].includes(o.status)).length} icon={Receipt} variant="slate" type="count" loading={!kpis && loading} />
                <KpiCard title={t('kpi.confirmed_ca') || 'CA ENGAGÉ'} value={kpis?.committedRevenue ?? orders.filter(o => ['VALIDATED','PREPARING','SHIPPED'].includes(o.status)).reduce((s, o) => s + Number(o.totalAmountTtc), 0)} icon={TrendingUp} variant="success" loading={!kpis && loading} />
                <KpiCard title={t('kpi.total_orders') || 'TOTAL BC'} value={kpis?.totalSalesOrders ?? orders.filter(o => o.status !== 'CANCELLED').length} icon={ShoppingCart} variant="primary" type="count" loading={!kpis && loading} />
                <KpiCard title={t('kpi.critical_stock') || 'ALERTES STOCK'} value={kpis?.stockAlerts ?? 0} icon={AlertTriangle} variant="danger" type="count" loading={!kpis && loading} />
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ct('filter') || 'Filtrer:'}</span>
                <button
                    onClick={() => setActiveStatus('')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${activeStatus === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                >
                    {t('status.all') || 'Tous'} ({orders.length})
                </button>
                {Object.entries(STATUS_META).map(([status, meta]) => {
                    const count = statusCounts[status] || 0;
                    if (!count) return null;
                    return (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(activeStatus === status ? '' : status)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${activeStatus === status ? meta.color + ' ring-2 ring-offset-1 ring-slate-400' : 'bg-white text-slate-500 border-slate-200 hover:' + meta.color}`}
                        >
                            {t(`status.${status.toLowerCase()}` as any) || meta.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Search + Customer filter */}
            <Card className="border-none shadow-xl shadow-gray-200/40">
                <CardHeader className="border-b border-slate-50 px-8 py-4 flex-row items-center justify-between gap-4">
                    <div className="relative group flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('search') || 'BC ou Client...'}
                            value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                        />
                    </div>
                    <select
                        className="border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-primary"
                        value={filters.customerId}
                        onChange={e => setFilters(f => ({ ...f, customerId: e.target.value }))}
                    >
                        <option value="">{t('all_customers') || 'Tous les clients'}</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={filteredOrders}
                        isLoading={loading}
                        onRowClick={openDetail}
                        columns={[
                            {
                                header: t('reference'),
                                accessor: (o) => (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900">{o.reference}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(o.date).toLocaleDateString(locale)}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: t('customer'),
                                accessor: (o) => (
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{o.customer?.name}</div>
                                        {o.dueDate && (
                                            <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${new Date(o.dueDate) < new Date() && !['INVOICED','CANCELLED'].includes(o.status) ? 'text-red-500' : 'text-slate-400'}`}>
                                                <Clock size={10} /> {t('due_date_label') || 'Échéance:'} {new Date(o.dueDate).toLocaleDateString(locale)}
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                header: t('total_ttc'),
                                align: 'right',
                                accessor: (o) => (
                                    <div className="text-right">
                                        <div className="font-black text-slate-900">{formatCurrency(o.totalAmountTtc)}</div>
                                        <div className="text-[9px] text-slate-400 font-bold">{formatCurrency(o.totalAmountHt)} HT</div>
                                    </div>
                                )
                            },
                            {
                                header: t('status_label'),
                                align: 'center',
                                accessor: (o) => (
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_META[o.status]?.color || 'bg-slate-50 text-slate-500'}`}>
                                        {t(`status.${o.status.toLowerCase()}` as any) || STATUS_META[o.status]?.label || o.status}
                                    </span>
                                )
                            },
                            {
                                header: t('fields.actions'),
                                align: 'center',
                                accessor: (o) => (
                                    <button
                                        onClick={e => { e.stopPropagation(); openDetail(o); }}
                                        className="h-9 w-9 bg-white text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm border border-blue-100 mx-auto"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            {/* ── CREATE MODAL (3 steps) ─────────────────────── */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-8 pb-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                    <ShoppingCart className="text-primary" size={24} /> {t('add')}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('add_subtitle')}</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex border-b border-slate-100 shrink-0 px-8">
                            {([
                                { id: 'info', label: t('steps.info'), icon: Info },
                                { id: 'lines', label: t('steps.lines'), icon: Package },
                                { id: 'summary', label: t('steps.summary'), icon: CheckCircle2 },
                            ] as const).map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStep(s.id)}
                                    className={`flex items-center gap-2 py-4 pr-8 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${step === s.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    <s.icon size={14} /> {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {step === 'info' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('customer')} *</label>
                                            <select
                                                required
                                                className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={newOrder.customerId}
                                                onChange={e => setNewOrder(o => ({ ...o, customerId: e.target.value }))}
                                            >
                                                <option value="">-- {t('select_customer')} --</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('date')}</label>
                                            <input
                                                type="date"
                                                defaultValue={new Date().toISOString().split('T')[0]}
                                                className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary font-bold text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('due_date')}</label>
                                            <input
                                                type="date"
                                                className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary font-bold text-slate-900"
                                                value={newOrder.dueDate || ''}
                                                onChange={e => setNewOrder(o => ({ ...o, dueDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('notes')}</label>
                                            <textarea
                                                className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary font-bold text-slate-900 min-h-[80px]"
                                                value={newOrder.notes || ''}
                                                onChange={e => setNewOrder(o => ({ ...o, notes: e.target.value }))}
                                                placeholder={t('notes_placeholder')}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { if (!newOrder.customerId) { toast.error(t('select_customer')); return; } setStep('lines'); }}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        {t('continue_lines')} <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}

                            {step === 'lines' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <OrderLineEditor
                                        initialLines={newOrder.lines.map(line => {
                                            const p = products.find(prod => prod.id === line.productId);
                                            return {
                                                productId: line.productId,
                                                productName: p?.name || '',
                                                productSku: p?.sku || '',
                                                productUnit: p?.unit || 'PCS',
                                                quantity: line.quantity,
                                                unitPriceHt: line.unitPriceHt,
                                                discountPercent: line.discountPercent || 0
                                            };
                                        })}
                                        onChange={(lines, totals) => {
                                            setNewOrder(prev => ({
                                                ...prev,
                                                lines: lines.map(l => ({
                                                    productId: l.productId,
                                                    quantity: l.quantity,
                                                    unitPriceHt: l.unitPriceHt,
                                                    discountPercent: l.discountPercent
                                                })),
                                                shippingCost: totals.shippingCost,
                                                discountPercent: totals.discountPercent
                                            }));
                                        }}
                                        productFilterType="FINISHED_GOOD"
                                        initialShippingCost={newOrder.shippingCost}
                                        initialDiscountPercent={newOrder.discountPercent}
                                    />

                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setStep('info')} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">{ct('back')}</button>
                                        <button
                                            onClick={() => { if (newOrder.lines.length === 0) { toast.error(t('errors.min_lines')); return; } setStep('summary'); }}
                                            className="flex-1 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                        >
                                            {t('continue_summary')} <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'summary' && (
                                <div className="space-y-6 animate-in fade-in duration-300">

                                    {/* Récapitulatif */}
                                    <div className="bg-slate-50 rounded-3xl p-6 space-y-3 border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('summary.title')}</h3>
                                        <div className="flex justify-between text-sm font-bold text-slate-600">
                                            <span>{t('summary.subtotal', { count: newOrder.lines.length })}</span>
                                            <span>{formatCurrency(computed.subtotalHt, locale)}</span>
                                        </div>
                                        {Number(newOrder.discountPercent) > 0 && (
                                            <div className="flex justify-between text-sm font-bold text-red-500">
                                                <span>{t('summary.discount', { pct: newOrder.discountPercent ?? 0 })}</span>
                                                <span>-{formatCurrency(computed.subtotalHt - computed.totalHt, locale)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-bold text-slate-600">
                                            <span>{ct('total_ht')}</span>
                                            <span>{formatCurrency(computed.totalHt, locale)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-slate-500">
                                            <span>{ct('tva')} (19%)</span>
                                            <span>{formatCurrency(computed.totalTva, locale)}</span>
                                        </div>
                                        {Number(newOrder.shippingCost) > 0 && (
                                            <div className="flex justify-between text-sm font-bold text-slate-500">
                                                <span>{t('summary.shipping')}</span>
                                                <span>{formatCurrency(Number(newOrder.shippingCost), locale)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-xl text-slate-900">
                                            <span>{ct('total_ttc')}</span>
                                            <span className="text-primary">{formatCurrency(computed.totalTtc, locale)}</span>
                                        </div>
                                        {/* Margin preview */}
                                        <div className={`flex justify-between text-[11px] font-black uppercase tracking-widest mt-2 px-4 py-2 rounded-xl ${getMarginColor(computed.marginPct)}`}>
                                            <span>{t('profitability.margin')}</span>
                                            <span>{formatCurrency(computed.margin, locale)} ({computed.marginPct.toFixed(1)}%)</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setStep('lines')} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">{ct('back')}</button>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleCreate(false)}
                                            className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><FileText size={16} /> {t('save_draft')}</>}
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleCreate(true)}
                                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> {t('validate_order')}</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── DETAIL SLIDE PANEL ─────────────────────────── */}
            {isDetailOpen && selectedOrder && (
                <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-400">
                        {/* Header */}
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedOrder.reference}</h2>
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{t('title')}</div>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} className="p-3 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Hero Card */}
                            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('total_ttc')}</div>
                                        <div className="text-4xl font-black leading-none">{formatCurrency(selectedOrder.totalAmountTtc, locale)}</div>
                                        <div className="text-[10px] opacity-60 mt-1">{formatCurrency(selectedOrder.totalAmountHt, locale)} HT + TVA {formatCurrency(selectedOrder.totalAmountTva, locale)}</div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md`}>
                                                {t(`status.${selectedOrder.status.toLowerCase()}`)}
                                            </span>
                                            <button onClick={() => downloadPdf(salesOrdersService.getPdfUrl(selectedOrder.id), `BC-${selectedOrder.reference}.pdf`)}
                                                className="px-3 py-1 bg-white text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 flex items-center gap-1.5">
                                                <Download size={12} /> PDF
                                            </button>
                                            <button onClick={() => downloadPdf(salesOrdersService.getDeliveryNoteUrl(selectedOrder.id), `BL-${selectedOrder.reference}.pdf`)}
                                                className="px-3 py-1 bg-blue-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 flex items-center gap-1.5">
                                                <Truck size={12} /> BL
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black">{selectedOrder.customer?.name}</div>
                                        <div className="text-[10px] opacity-60 mt-1">{new Date(selectedOrder.date).toLocaleDateString(locale)}</div>
                                        {selectedOrder.dueDate && (
                                            <div className={`text-[10px] mt-1 font-bold ${new Date(selectedOrder.dueDate) < new Date() ? 'text-red-300' : 'text-white/70'}`}>
                                                {t('due')}: {new Date(selectedOrder.dueDate).toLocaleDateString(locale)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Margin Block */}
                            {selectedOrder.profitability && (
                                <div className={`p-5 rounded-2xl flex items-center justify-between ${getMarginColor(selectedOrder.profitability.marginPercent)} border`}>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('profitability.margin')}</div>
                                        <div className="text-2xl font-black">{formatCurrency(selectedOrder.profitability.totalMargin, locale)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black">{selectedOrder.profitability.marginPercent.toFixed(1)}%</div>
                                        <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{t('profitability.cost')}: {formatCurrency(selectedOrder.profitability.totalCost, locale)}</div>
                                    </div>
                                    {selectedOrder.profitability.marginPercent >= 30
                                        ? <TrendingUp size={32} className="opacity-30" />
                                        : <TrendingDown size={32} className="opacity-30" />
                                    }
                                </div>
                            )}

                            {/* Order Lines */}
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('sections.items')}</h3>
                                <div className="space-y-2">
                                    {selectedOrder.lines.map((line, idx) => {
                                        const lineProfit = selectedOrder.profitability?.details?.find(d => d.productId === line.productId);
                                        return (
                                            <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                            <Package size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm">{line.product.name}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase">
                                                                {Number(line.quantity)} {line.unit} × {formatCurrency(line.unitPriceHt, locale)}
                                                                {Number(line.discountPercent) > 0 && <span className="text-orange-500"> (-{Number(line.discountPercent)}%)</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-black text-slate-900 text-sm">{formatCurrency(line.lineTotalHt, locale)} HT</div>
                                                        {lineProfit && (
                                                            <div className={`text-[9px] font-black uppercase tracking-widest ${lineProfit.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {t('profitability.margin')}: {formatCurrency(lineProfit.margin, locale)} ({lineProfit.marginPercent.toFixed(1)}%)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Linked Invoice */}
                            {selectedOrder.invoice && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Receipt className="text-blue-600" size={20} />
                                        <div>
                                            <div className="font-bold text-blue-900 text-sm">{selectedOrder.invoice.reference}</div>
                                            <div className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{selectedOrder.invoice.status}</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-blue-400" />
                                </div>
                            )}
                        </div>

                        {/* Action Footer — conditional by status */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
                            {selectedOrder.status === 'DRAFT' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleAction('validate', selectedOrder.id)} disabled={isSubmitting}
                                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> {t('actions.validate')}</>}
                                    </button>
                                    <button onClick={() => handleAction('cancel', selectedOrder.id)} disabled={isSubmitting}
                                        className="px-6 py-4 bg-white border border-red-200 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        <Ban size={16} /> {ct('cancel')}
                                    </button>
                                </div>
                            )}
                            {(selectedOrder.status === 'VALIDATED' || selectedOrder.status === 'PREPARING') && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleAction('ship', selectedOrder.id)} disabled={isSubmitting}
                                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Truck size={16} /> {t('actions.ship')}</>}
                                    </button>
                                    <button onClick={() => handleAction('cancel', selectedOrder.id)} disabled={isSubmitting}
                                        className="px-6 py-4 bg-white border border-red-200 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        <Ban size={16} /> {ct('cancel')}
                                    </button>
                                </div>
                            )}
                            {selectedOrder.status === 'SHIPPED' && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 size={16} /> {t('delivery_validated')} {selectedOrder.shippedAt ? new Date(selectedOrder.shippedAt).toLocaleDateString(locale) : '-'}
                                    </div>
                                    <button onClick={() => handleAction('invoice', selectedOrder.id)} disabled={isSubmitting}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Receipt size={16} /> {t('actions.invoice')}</>}
                                    </button>
                                </div>
                            )}
                            {selectedOrder.status === 'INVOICED' && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                    <Receipt size={16} /> {t('status_invoiced_no_action')}
                                </div>
                            )}
                            {selectedOrder.status === 'CANCELLED' && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                    <Ban size={16} /> {t('status_cancelled_no_action')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
