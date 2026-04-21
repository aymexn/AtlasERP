'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Truck, Search, Loader2, CheckCircle2, X, ChevronRight, 
    Warehouse as WarehouseIcon, ShoppingBag, Calendar,
    Package, Info, AlertTriangle, FileCheck, Filter,
    PackageSearch, Receipt, ArrowRight, Clock, History, User,
    Settings, Download, MoreVertical, LayoutGrid, FileSearch, Check
} from 'lucide-react';
import { StockReception, PurchaseOrder } from '@/services/purchases';
import { Warehouse } from '@/services/inventory';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

export default function ReceptionsClient() {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();

    const searchParams = useSearchParams();
    const orderIdParam = searchParams.get('orderId');
    
    const [receptions, setReceptions] = useState<StockReception[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'VALIDATED'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'config' | 'lines'>('info');
    const [submitting, setSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [selectedReception, setSelectedReception] = useState<StockReception | null>(null);

    const [createForm, setCreateForm] = useState({
        warehouseId: '',
        notes: ''
    });

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [receptionsData, warehousesData] = await Promise.all([
                apiFetch('/stock-receptions'),
                apiFetch('/warehouses')
            ]);

            setReceptions(Array.isArray(receptionsData) ? receptionsData : receptionsData.data || []);
            setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.data || []);

            if (orderIdParam) {
                const order = await apiFetch(`/purchase-orders/${orderIdParam}`);
                setSelectedOrder(order);
                setIsCreateMode(true);
                setIsModalOpen(true);
                const whs = Array.isArray(warehousesData) ? warehousesData : warehousesData.data || [];
                if (whs.length > 0) {
                    setCreateForm(prev => ({ ...prev, warehouseId: whs[0].id }));
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !createForm.warehouseId) {
            toast.error(ct('missing_fields' as any) || 'Veuillez remplir tous les champs');
            return;
        }

        try {
            setSubmitting(true);
            await apiFetch('/stock-receptions', {
                method: 'POST',
                body: JSON.stringify({
                    purchaseOrderId: selectedOrder.id,
                    warehouseId: createForm.warehouseId,
                    notes: createForm.notes
                })
            });
            toast.success(t('purchases.receptions.toast.created' as any) || 'Réception créée');
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleValidate = async (id: string) => {
        try {
            setSubmitting(true);
            await apiFetch(`/stock-receptions/${id}/validate`, { method: 'POST' });
            toast.success(ct('save_success'));
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReceptions = useMemo(() => {
        const filtered = receptions.filter(r => {
            const matchesSearch = 
                (r.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                (r.purchaseOrder?.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (r.purchaseOrder?.supplier?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        return [...filtered].reverse();
    }, [receptions, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: (receptions || []).length,
            validated: (receptions || []).filter(r => r.status === 'VALIDATED').length,
            draft: (receptions || []).filter(r => r.status === 'DRAFT').length
        };
    }, [receptions]);

    const getStatusVariant = (status: string) => {
        switch(status) {
            case 'DRAFT': return 'warning';
            case 'VALIDATED': return 'active';
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
                title={t('receptions.title')}
                subtitle={t('receptions.subtitle')}
                icon={Truck}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KpiCard 
                    title={t('receptions.kpi.total')}
                    value={stats.total}
                    icon={Package}
                    variant="primary"
                    type="count"
                    subtitle={t('receptions.kpi.total_desc')}
                />
                <KpiCard 
                    title={t('receptions.kpi.validated')}
                    value={stats.validated}
                    icon={CheckCircle2}
                    variant="success"
                    type="count"
                    subtitle={t('receptions.kpi.validated_desc')}
                />
                <KpiCard 
                    title={t('receptions.kpi.draft')}
                    value={stats.draft}
                    icon={Clock}
                    variant="warning"
                    type="count"
                    subtitle={t('receptions.kpi.draft_desc')}
                />
            </div>

            {/* Main Area */}
            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <WarehouseIcon className="w-6 h-6 text-primary" />
                        {t('receptions.list')}
                    </CardTitle>
                    <div className="flex items-center gap-6">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text"
                                placeholder={ct('search')}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold h-[52px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-[1.25rem]">
                            {(['ALL', 'DRAFT', 'VALIDATED'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        statusFilter === status 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {t(`receptions.status.${status.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                        data={filteredReceptions}
                        isLoading={loading}
                        onRowClick={(r) => {
                            setSelectedReception(r);
                            setIsCreateMode(false);
                            setActiveTab('info');
                            setIsModalOpen(true);
                        }}
                        columns={[
                            {
                                header: t('receptions.fields.reference' as any) || "RÉFERENCE",
                                className: "w-[180px]",
                                accessor: (r) => (
                                    <div className="px-3 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] rounded-lg font-black tracking-tight inline-block uppercase">
                                        {r.reference}
                                    </div>
                                )
                            },
                            {
                                header: t('receptions.fields.supplier' as any) || "FOURNISSEUR",
                                className: "w-[250px]",
                                accessor: (r) => <span className="text-slate-900 font-black text-[15px] tracking-tight">{r.purchaseOrder?.supplier?.name}</span>
                            },
                            {
                                header: t('receptions.fields.bc' as any) || "BON DE COMMANDE",
                                accessor: (r) => <span className="text-sm font-bold text-slate-500">{r.purchaseOrder?.reference}</span>
                            },
                            {
                                header: t('receptions.fields.reception_date' as any) || "DATE RÉCEPTION",
                                accessor: (r) => <span className="text-sm font-bold text-slate-500">{new Date(r.receivedAt || r.createdAt).toLocaleDateString(locale)}</span>
                            },
                            {
                                header: ct('status'),
                                accessor: (r) => (
                                    <Badge variant={getStatusVariant(r.status) as any}>
                                        {t(`receptions.status.${r.status.toLowerCase()}` as any)}
                                    </Badge>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Elite Modal Detail / Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-4xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        {/* Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {isCreateMode ? t('receptions.title') : selectedReception?.reference}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                    {isCreateMode ? t('receptions.subtitle') : t('receptions.details.logistic_info')}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-8 mt-4 gap-6 border-b border-slate-50 overflow-x-auto scrollbar-hide">
                            {(isCreateMode ? [
                                { id: 'info', label: "Origine", icon: ShoppingBag },
                                { id: 'config', label: "Configuration", icon: Settings },
                            ] : [
                                { id: 'info', label: "Informations", icon: Info },
                                { id: 'lines', label: "Articles", icon: Package },
                            ]).map((tab) => (
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

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            {isCreateMode && selectedOrder && (
                                <>
                                    {activeTab === 'info' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Origine Commande</h3>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-black text-slate-900">{selectedOrder.reference}</span>
                                                        <span className="text-xs font-bold text-slate-500">{selectedOrder.supplier?.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-black text-primary">{formatCurrency(selectedOrder.totalTtc)}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedOrder.lines?.length || 0} Articles</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-blue-50/50 rounded-2xl flex items-center gap-3">
                                                <Info className="text-primary" size={18} />
                                                <p className="text-[11px] font-bold text-primary uppercase">La validation mettra à jour instantanément les stocks réels dans l'entrepôt sélectionné.</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'config' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('receptions.fields.warehouse')}</label>
                                                <select
                                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                    value={createForm.warehouseId}
                                                    onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
                                                >
                                                    <option value="">{ct('select_placeholder')}</option>
                                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('receptions.details.note')}</label>
                                                <textarea
                                                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900 text-sm resize-none"
                                                    rows={4}
                                                    value={createForm.notes}
                                                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {!isCreateMode && selectedReception && (
                                <>
                                    {activeTab === 'info' && (
                                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Origine</h4>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div className="text-sm font-black text-slate-900">{selectedReception.purchaseOrder?.reference}</div>
                                                        <div className="text-[10px] font-bold text-slate-500">{selectedReception.purchaseOrder?.supplier?.name}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destination</h4>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div className="text-sm font-black text-slate-900">{selectedReception.warehouse?.name}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedReception.notes && (
                                                <div className="relative p-6 overflow-hidden rounded-3xl bg-slate-900 group shadow-xl">
                                                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                                        <Info size={60} className="text-white" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">{t('receptions.details.note')}</div>
                                                        <div className="text-sm font-bold text-slate-300 leading-relaxed italic">"{selectedReception.notes}"</div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedReception.status === 'DRAFT' && (
                                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4">
                                                    <AlertTriangle className="text-rose-600 mt-1" size={20} />
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-red-900 uppercase tracking-widest">{t('receptions.details.validation_title')}</div>
                                                        <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed opacity-70">
                                                            {t('receptions.details.validation_warning')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'lines' && (
                                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('receptions.details.lines')}</h4>
                                            <div className="rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                                                {selectedReception.lines?.map((line, i) => (
                                                    <div key={i} className="p-5 flex items-center justify-between bg-slate-50/30 hover:bg-white transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-900">{line.product?.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: {line.product?.sku || 'N/A'}</span>
                                                        </div>
                                                        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-primary shadow-sm">
                                                            {line.receivedQty} {line.unit}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shadow-inner">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all font-bold"
                            >
                                {ct('cancel')}
                            </button>
                            {isCreateMode ? (
                                <button
                                    onClick={handleCreateSubmit}
                                    disabled={submitting}
                                    className="px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><FileCheck size={18} /> {t('receptions.details.validate_button')}</>}
                                </button>
                            ) : selectedReception?.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleValidate(selectedReception.id)}
                                    disabled={submitting}
                                    className="px-12 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> {t('receptions.details.validate_button')}</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
