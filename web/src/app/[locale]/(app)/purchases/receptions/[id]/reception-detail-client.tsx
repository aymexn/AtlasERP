'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Truck, ArrowLeft, Loader2, CheckCircle2, 
    Warehouse as WarehouseIcon, Package, Calculator,
    Info, AlertCircle, Save, ShoppingCart, Calendar,
    Receipt, Layers, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReceptionLine {
    id: string;
    productId: string;
    product: { 
        name: string; 
        sku: string;
        unit: string; // Added missing unit field
    };
    expectedQty: number;
    receivedQty: number;
    unit: string;
    unitCost: number;
}

interface StockReception {
    id: string;
    reference: string;
    status: 'DRAFT' | 'VALIDATED';
    receivedAt: string;
    notes?: string;
    warehouse: { name: string };
    purchaseOrder: { reference: string; supplier: { name: string } };
    lines: ReceptionLine[];
}

interface ReceptionDetailClientProps {
    id: string;
}

export default function ReceptionDetailClient({ id }: ReceptionDetailClientProps) {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [reception, setReception] = useState<StockReception | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editedLines, setEditedLines] = useState<Record<string, number>>({});

    useEffect(() => {
        loadReception();
    }, [id]);

    const loadReception = async () => {
        if (!id || id === 'undefined' || id === '[id]') {
            router.push(`/${locale}/purchases/receptions`);
            return;
        }
        try {
            setLoading(true);
            const data = await apiFetch(`/stock-receptions/${id}`);
            setReception(data);
            
            // Initialize edited lines
            const lines: Record<string, number> = {};
            data.lines.forEach((l: ReceptionLine) => {
                lines[l.id] = Number(l.receivedQty);
            });
            setEditedLines(lines);
        } catch (err: any) {
            console.error('[ReceptionDetail] Load Error:', err);
            toast.error(err.message || ct('errors.fetch_failed' as any));
            // Add a small delay before redirecting to allow user to see the toast
            setTimeout(() => {
                router.push(`/${locale}/purchases/receptions`);
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQty = (lineId: string, qty: number) => {
        setEditedLines(prev => ({ ...prev, [lineId]: qty }));
    };

    const handleSaveDraft = async () => {
        try {
            setSubmitting(true);
            const lines = Object.entries(editedLines).map(([lineId, qty]) => ({
                id: lineId,
                receivedQty: qty
            }));

            await apiFetch(`/stock-receptions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ lines })
            });

            toast.success(ct('save_success' as any));
            await loadReception();
        } catch (err: any) {
            toast.error(err.message || ct('errors.submit_failed' as any));
        } finally {
            setSubmitting(false);
        }
    };

    const handleValidate = async () => {
        if (!window.confirm(t('receptions.details.validation_warning'))) return;

        try {
            setSubmitting(true);
            // First save any changes
            const lines = Object.entries(editedLines).map(([lineId, qty]) => ({
                id: lineId,
                receivedQty: qty
            }));

            await apiFetch(`/stock-receptions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ lines })
            });

            // Then validate
            await apiFetch(`/stock-receptions/${id}/validate`, {
                method: 'POST'
            });

            toast.success(t('receptions.toast.validated'));
            router.push(`/${locale}/purchases/receptions`);
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

    if (!reception) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <AlertCircle size={40} />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">Réception Introuvable</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                        Cette réception n'existe pas ou a été supprimée.
                    </p>
                </div>
                <button 
                    onClick={() => router.push(`/${locale}/purchases/receptions`)}
                    className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                >
                    {ct('back')}
                </button>
            </div>
        );
    }

    const isDraft = reception.status === 'DRAFT';

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-100 transition-all active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                                {reception.reference}
                            </h1>
                            <Badge variant={reception.status === 'VALIDATED' ? 'active' : 'draft'}>
                                {t(`receptions.status.${reception.status.toLowerCase()}`)}
                            </Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {t('receptions.subtitle')}
                        </p>
                    </div>
                </div>
                
                {isDraft && (
                    <div className="flex items-center gap-4">
                        <button 
                            disabled={submitting}
                            onClick={handleSaveDraft}
                            className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {ct('save')}
                        </button>
                        <button 
                            disabled={submitting}
                            onClick={handleValidate}
                            className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            {t('receptions.details.validate_button')}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[3rem] overflow-hidden bg-white p-10">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 mb-8">
                            <Layers className="text-blue-600" />
                            {t('receptions.details.lines')}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="pb-4 px-4">{ct('fields.name' as any)}</th>
                                        <th className="pb-4 px-4 text-center">{t('receptions.form.qty_ordered')}</th>
                                        <th className="pb-4 px-4 text-center">{t('receptions.form.qty_received')}</th>
                                        <th className="pb-4 px-4 text-right">{ct('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reception.lines.map((line) => (
                                        <tr key={line.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-6 px-4">
                                                <p className="font-black text-slate-900 uppercase tracking-tight">{line.product.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 bg-slate-100 px-2 py-0.5 rounded-lg w-fit">{line.product.sku}</p>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <span className="font-black text-slate-700">{line.expectedQty}</span>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1">{line.product.unit}</span>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                {isDraft ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <input 
                                                            type="number"
                                                            value={editedLines[line.id] || 0}
                                                            onChange={(e) => handleUpdateQty(line.id, Number(e.target.value))}
                                                            className="w-24 h-11 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-slate-900 focus:border-blue-600 transition-all"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{line.product.unit}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-emerald-600">{line.receivedQty} {line.product.unit}</span>
                                                )}
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                {editedLines[line.id] >= line.expectedQty ? (
                                                    <Badge variant="active" className="rounded-xl">{t('receptions.details.table.full')}</Badge>
                                                ) : editedLines[line.id] > 0 ? (
                                                    <Badge variant="warning" className="rounded-xl">{t('receptions.details.table.partial')}</Badge>
                                                ) : (
                                                    <Badge variant="draft" className="rounded-xl">{t('receptions.details.table.none')}</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {reception.notes && (
                        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-amber-50/30 p-10">
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Info size={14} /> {t('receptions.details.note')}
                            </h3>
                            <p className="text-slate-700 font-medium italic leading-relaxed">
                                "{reception.notes}"
                            </p>
                        </Card>
                    )}
                </div>

                {/* Sidebar Details */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[2.5rem] bg-white p-8 space-y-8">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">
                            {t('receptions.details.logistic_info')}
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <ShoppingCart size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('receptions.fields.bc')}</p>
                                    <p className="font-black text-slate-900 uppercase tracking-tight">{reception.purchaseOrder.reference}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('receptions.fields.supplier')}</p>
                                    <p className="font-black text-slate-900 uppercase tracking-tight">{reception.purchaseOrder.supplier.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <WarehouseIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('receptions.fields.warehouse')}</p>
                                    <p className="font-black text-slate-900 uppercase tracking-tight">{reception.warehouse.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('receptions.fields.reception_date')}</p>
                                    <p className="font-black text-slate-900 uppercase tracking-tight">
                                        {new Date(reception.receivedAt).toLocaleDateString(locale)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {isDraft && (
                        <Card className="border-none shadow-2xl shadow-emerald-100 rounded-[2.5rem] bg-emerald-50 p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <AlertCircle size={24} />
                                </div>
                                <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight">{t('receptions.details.ready_title')}</h4>
                            </div>
                            <p className="text-xs font-bold text-emerald-700 leading-relaxed uppercase opacity-80">
                                {t('receptions.details.ready_desc')}
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
