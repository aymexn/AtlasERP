'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    ShoppingBag, ArrowLeft, Loader2, CheckCircle2, 
    Send, Ban, Truck, Calendar, User, Package,
    Receipt, Info, Printer, Download, Clock,
    AlertTriangle, ChevronRight, Layers, Target, Play,
    Calculator, PackageSearch, Warehouse as WarehouseIcon
} from 'lucide-react';
import { purchasesService, PurchaseOrder } from '@/services/purchases';
import { inventoryService, Warehouse } from '@/services/inventory';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { downloadPdf } from '@/lib/download-pdf';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from '@/components/ui/sheet';

interface OrderDetailClientProps {
    id: string;
}

export default function OrderDetailClient({ id }: OrderDetailClientProps) {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Reception creation state
    const [isReceptionSheetOpen, setIsReceptionSheetOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        warehouseId: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [orderData, warehousesData] = await Promise.all([
                purchasesService.getOrderById(id),
                inventoryService.listWarehouses()
            ]);
            setOrder(orderData);
            setWarehouses(warehousesData || []);
            if (warehousesData && warehousesData.length > 0) {
                setCreateForm(prev => ({ ...prev, warehouseId: warehousesData[0].id }));
            }
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
            router.push('/purchases/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'confirm' | 'send' | 'cancel') => {
        try {
            setSubmitting(true);
            if (action === 'confirm') await purchasesService.confirmOrder(id);
            if (action === 'send') await purchasesService.sendOrder(id);
            if (action === 'cancel') {
                if (!window.confirm(ct('delete_confirm'))) return;
                await purchasesService.cancelOrder(id);
            }
            toast.success(ct('save_success'));
            await loadData();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateReception = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.warehouseId) return;

        try {
            setSubmitting(true);
            const result = await purchasesService.createReception(id, createForm.warehouseId, createForm.notes);
            toast.success('Réception créée avec succès');
            setIsReceptionSheetOpen(false);
            setCreateForm({ ...createForm, notes: '' });
            router.push(`/${locale}/purchases/receptions`);
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
            await loadData(); // Reload order to update status
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'SENT': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'PARTIALLY_RECEIVED': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'RECEIVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="flex flex-col gap-8 pb-10 animate-in fade-in duration-700">
            {/* Header Navigation */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.push(`/${locale}/purchases/orders`)}
                    className="h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                            {order.reference}
                        </h1>
                        <Badge className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                            {t(`status.${order.status.toLowerCase()}`)}
                        </Badge>
                    </div>
                    <p className="text-gray-500 font-medium">{t('order_detail_description')}</p>
                </div>
            </div>

            {/* Quick Stats & Main Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Supplier & Dates Card */}
                <Card className="border-none shadow-sm bg-white rounded-4xl">
                    <CardHeader className="py-6 border-b border-gray-50 pb-4">
                        <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            {t('supplier')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-6 space-y-6">
                        <div>
                            <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{order.supplier?.name}</p>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">ID: {order.supplierId.split('-')[0]}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t('order_date')}</p>
                                <div className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase">
                                    <Calendar size={14} className="text-blue-500" />
                                    {new Date(order.orderDate).toLocaleDateString(locale)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t('expected_date')}</p>
                                <div className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase">
                                    <Clock size={14} className="text-amber-500" />
                                    {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString(locale) : '—'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Card */}
                <Card className="bg-white border-2 border-blue-50 shadow-xl shadow-blue-50/20 flex flex-col justify-between text-gray-900 overflow-hidden relative group rounded-4xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform text-blue-600">
                        <Receipt size={120} />
                    </div>
                    <CardHeader className="py-4 border-b border-blue-50 relative z-10 bg-blue-50/30">
                        <CardTitle className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calculator size={14} />
                            RÉSUMÉ FINANCIER
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-8 relative z-10 flex flex-col justify-between h-full bg-white">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <span>NET H.T</span>
                                <span className="text-gray-900">{formatCurrency(order.totalHt)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <span>T.V.A (19%)</span>
                                <span className="text-blue-600">+{formatCurrency(order.totalTva)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('total_ttc')}</p>
                                    <p className="text-4xl font-black tracking-tighter text-blue-600 leading-none">{formatCurrency(order.totalTtc)}</p>
                                </div>
                                <button 
                                    onClick={() => downloadPdf(purchasesService.getPdfUrl(order.id), `bcf-${order.reference}.pdf`)}
                                    className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 border border-blue-100"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status & Actions Card */}
                <Card className="border-none shadow-sm bg-white rounded-4xl flex flex-col justify-between">
                    <CardHeader className="py-6 border-b border-gray-50">
                        <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            WORKFLOW ACTIONS
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-8 flex flex-col gap-4">
                        {order.status === 'DRAFT' && (
                            <button 
                                onClick={() => handleAction('confirm')}
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> CONFIRMER LE B.C.F</>}
                            </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                            <button 
                                onClick={() => handleAction('send')}
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> ENVOYER AU FOURNISSEUR</>}
                            </button>
                        )}
                        {['CONFIRMED', 'SENT', 'PARTIALLY_RECEIVED'].includes(order.status) && (
                            <button 
                                onClick={() => setIsReceptionSheetOpen(true)}
                                className="w-full bg-gray-900 hover:bg-black text-white p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Truck size={20} /> CRÉER RÉCEPTION
                            </button>
                        )}
                         {!['RECEIVED', 'CANCELLED'].includes(order.status) && (
                            <button 
                                onClick={() => handleAction('cancel')}
                                disabled={submitting}
                                className="w-full bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Ban size={20} /> ANNULER LA COMMANDE
                            </button>
                        )}
                        {order.status === 'RECEIVED' && (
                             <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center gap-2 text-center">
                                <CheckCircle2 className="text-emerald-600" size={32} />
                                <p className="text-sm font-black text-emerald-700 uppercase tracking-widest">{t('status.received')}</p>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Lines Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Layers size={18} />
                        </div>
                        {t('orders.sections.items')}
                    </h3>
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.lines?.length || 0} ARTICLES</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-50">
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">{t('common.fields.name' as any)}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">{t('common.qty' as any)}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">{t('common.received' as any)}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">P.U HT</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">TOTAL HT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.lines?.map((line: any) => (
                                <tr key={line.id} className="group hover:bg-blue-50/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-gray-900 text-sm group-hover:text-blue-600 transition-colors tracking-tight uppercase">
                                            {line.product?.name || '—'}
                                        </div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 bg-gray-50 px-1.5 py-0.5 rounded-md w-fit border border-gray-100">
                                            {line.product?.sku}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="font-black text-gray-900 text-base">{line.quantity}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">{line.unit}</span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`font-black text-base ${Number(line.receivedQty) >= Number(line.quantity) ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                {line.receivedQty || 0}
                                            </span>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full ${Number(line.receivedQty) >= Number(line.quantity) ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                    style={{ width: `${Math.min(100, (Number(line.receivedQty) / Number(line.quantity)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-gray-600">
                                        {formatCurrency(line.unitPriceHt)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-gray-900">
                                        {formatCurrency(line.totalHt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Note Section */}
            {order.notes && (
                <div className="bg-amber-50/30 border border-amber-100 rounded-4xl p-8">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info size={14} /> NOTES & OBSERVATIONS
                    </h4>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed italic">
                        "{order.notes}"
                    </p>
                </div>
            )}

            {/* Receptions Creation Sheet directly inside Order Detail */}
            <Sheet open={isReceptionSheetOpen} onOpenChange={setIsReceptionSheetOpen}>
                <SheetContent side="right" className="w-screen sm:max-w-4xl p-0 border-l border-gray-100">
                    <div className="flex flex-col h-full bg-slate-50/30">
                        <SheetHeader className="p-8 bg-white border-b border-gray-100">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
                                    <PackageSearch size={24} />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-black text-gray-900 tracking-tight">
                                        Nouvelle Réception
                                    </SheetTitle>
                                    <SheetDescription className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                                        B.C.F: {order.reference} • {order.supplier?.name}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <form onSubmit={handleCreateReception} className="flex-1 overflow-y-auto p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                        ENTREPÔT DE DESTINATION
                                    </label>
                                    <select 
                                        required
                                        className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-sm shadow-sm outline-none focus:border-blue-600 transition-all"
                                        value={createForm.warehouseId}
                                        onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
                                    >
                                        <option value="">Sélectionner un entrepôt...</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                        RÉF. BON DE COMMANDE
                                    </label>
                                    <div className="p-4 bg-gray-100 border border-gray-200 rounded-2xl font-black text-gray-600 text-sm">
                                        {order.reference}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    NOTES & OBSERVATIONS LORS DE LA RÉCEPTION (OPTIONNEL)
                                </label>
                                <textarea 
                                    className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl font-medium text-sm shadow-sm outline-none focus:border-blue-600 transition-all resize-none"
                                    rows={4}
                                    placeholder="Notes logistiques, état du colis, documents manquants..."
                                    value={createForm.notes}
                                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                                <Info className="text-blue-600 mt-1" size={20} />
                                <p className="text-xs font-bold text-blue-900/70 leading-relaxed uppercase">
                                    La réception sera créée en mode BROUILLON. Vous serez redirigé vers son détail pour valider les quantités reçues ligne par ligne avant leur intégration au stock physique.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-4xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-4"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={18} /> CONFIRMER & AJUSTER QUANTITÉS</>}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsReceptionSheetOpen(false)}
                                    className="px-10 py-5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-4xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    {ct('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
