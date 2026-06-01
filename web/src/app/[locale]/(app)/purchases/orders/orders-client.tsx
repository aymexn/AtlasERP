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
            const allProds = Array.isArray(productsData) ? productsData : productsData.data ?? [];
            setAvailableProducts(allProds.filter((p: any) => p.type === 'FINISHED_GOOD' || p.articleType === 'FINISHED_PRODUCT'));
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

    const handleAdd = () => {
        router.push('/purchases/orders/new');
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
            {/* Themed Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                            <ShoppingCart size={24} />
                        </div>
                        {t('orders.title')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('orders.subtitle')}</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-orange-600/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    {t('orders.add')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title={t('orders.kpi.active_orders') || 'Commandes Actives'} 
                    value={orders.filter(o => !['FULLY_RECEIVED', 'CANCELLED'].includes(o.status)).length}
                    icon={ShoppingBag} 
                    variant="warning" 
                    type="count" 
                    loading={loading} 
                />
                <KpiCard 
                    title={t('orders.kpi.total_cost') || 'Montant Total HT'} 
                    value={orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + Number(o.totalTtc), 0)}
                    icon={Calculator} 
                    variant="primary" 
                    type="currency" 
                    loading={loading} 
                />
                <KpiCard 
                    title={t('orders.kpi.received') || 'Réceptionnées'} 
                    value={orders.filter(o => o.status === 'FULLY_RECEIVED').length}
                    icon={Package} 
                    variant="success" 
                    type="count" 
                    loading={loading} 
                />
                <KpiCard 
                    title={t('orders.kpi.pending') || 'En Attente'} 
                    value={orders.filter(o => o.status === 'PARTIALLY_RECEIVED' || o.status === 'SENT').length}
                    icon={Clock} 
                    variant="warning" 
                    type="count" 
                    loading={loading} 
                />
            </div>

            {/* Main Table */}
            <Card className="border border-orange-100 shadow-2xl shadow-orange-900/5 rounded-4xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-orange-50 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <PackageSearch className="w-6 h-6 text-orange-600" />
                        {t('orders.title')}
                    </CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder={ct('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-bold h-[52px]"
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
                                        {t(`status.${row.status.toLowerCase()}` as any)}
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
        </div>
    );
}
