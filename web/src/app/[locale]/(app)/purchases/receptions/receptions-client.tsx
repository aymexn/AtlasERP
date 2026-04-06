'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Truck, Search, Loader2, CheckCircle2, X, ChevronRight, 
    Warehouse as WarehouseIcon, ShoppingBag, Calendar, ArrowRight,
    Package, Info, AlertTriangle, FileCheck, Ban, Filter
} from 'lucide-react';
import { purchasesService, StockReception } from '@/services/purchases';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

export default function ReceptionsClient() {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [receptions, setReceptions] = useState<StockReception[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReception, setSelectedReception] = useState<StockReception | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await purchasesService.getAllReceptions();
            setReceptions(data || []);
        } catch (error) {
            console.error(error);
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (id: string) => {
        if (!window.confirm(ct('confirm'))) return;
        try {
            setSubmitting(true);
            await purchasesService.validateReception(id);
            toast.success(ct('toast.updated'));
            const updated = await purchasesService.getReceptionById(id);
            setSelectedReception(updated);
            await loadData();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReceptions = useMemo(() => {
        return (receptions || []).filter(r => {
            const matchesSearch = 
                (r.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                (r.purchaseOrder?.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (r.purchaseOrder?.supplier?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [receptions, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: (receptions || []).length,
            validated: (receptions || []).filter(r => r.status === 'VALIDATED').length,
            draft: (receptions || []).filter(r => r.status === 'DRAFT').length,
            items: (receptions || []).reduce((acc, r) => acc + (r.lines?.length || 0), 0)
        };
    }, [receptions]);

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200 shadow-none';
            case 'VALIDATED': return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading && receptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-100">
                        <Truck size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('receptions')}</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{t('receptions_subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: t('reception_kpi.total'), value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: t('reception_kpi.validated'), value: stats.validated, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: t('reception_kpi.draft'), value: stats.draft, icon: Info, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: t('reception_kpi.items'), value: stats.items, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <p className="text-2xl font-black text-gray-900 tracking-tighter">{kpi.value}</p>
                        </div>
                        <div className={`h-12 w-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <kpi.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden shadow-gray-200/50">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6 bg-gray-50/20">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={ct('search')}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all text-sm font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        {['ALL', 'DRAFT', 'VALIDATED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    statusFilter === status 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {t(`status.${status.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredReceptions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('fields.reference')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('fields.supplier')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('fields.warehouse')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('fields.status')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('fields.date')}</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredReceptions.map((r) => (
                                    <tr key={r.id} className="hover:bg-emerald-50/30 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-600" onClick={() => { setSelectedReception(r); setIsModalOpen(true); }}>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-black text-emerald-900 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg w-fit group-hover:bg-white">{r.reference}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-gray-900 text-base group-hover:text-emerald-600 transition-colors uppercase leading-tight">{r.purchaseOrder?.supplier?.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest">{t('fields.bc')}: {r.purchaseOrder?.reference}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-gray-700 font-bold">
                                                <WarehouseIcon size={14} className="text-emerald-400" />
                                                <span>{r.warehouse?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${getStatusStyles(r.status)}`}>
                                                {t(`status.${r.status.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-medium whitespace-nowrap">
                                            {new Date(r.createdAt || r.receivedAt).toLocaleDateString(locale)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="h-10 w-10 bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-90 transition-all shadow-sm border border-gray-100 rounded-2xl group-hover:border-emerald-600 ml-auto">
                                                <ChevronRight size={20} />
                                            </div>
                                        </td>
                                    </tr>
                                )).reverse()}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mb-6">
                            <Truck size={48} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{t('reception_empty.title')}</h3>
                        <p className="text-gray-400 font-medium max-w-xs">{t('reception_empty.desc')}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && selectedReception && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-4xl relative z-50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
                        
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                        {selectedReception.reference}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${getStatusStyles(selectedReception.status)}`}>
                                            {t(`status.${selectedReception.status.toLowerCase()}`)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase ml-2">{t('fields.bc')}: {selectedReception.purchaseOrder?.reference}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-all p-3 bg-gray-50 rounded-2xl">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <Info size={18} />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Informations Logistiques</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{t('fields.warehouse')}</p>
                                            <p className="text-sm font-black text-gray-900 mt-1 flex items-center gap-2">
                                                <WarehouseIcon size={16} className="text-emerald-400" /> {selectedReception.warehouse?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{t('fields.date')}</p>
                                            <p className="text-sm font-bold text-gray-700 mt-1 flex items-center gap-2">
                                                <Calendar size={16} className="text-gray-300" /> {new Date(selectedReception.createdAt).toLocaleDateString(locale)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-900 p-8 rounded-[2rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 h-24 w-24 bg-white/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform"></div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t('reception_kpi.items')}</p>
                                        <p className="text-4xl font-black tracking-tighter">{selectedReception.lines?.length || 0}</p>
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Inspection requise</p>
                                    </div>
                                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                        <Package size={32} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden mb-10">
                                <div className="p-8 border-b border-gray-50 bg-gray-50/20">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        Lignes réceptionnées
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/30 border-b border-gray-100">
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Article</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Attendu</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Reçu</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Écart</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Coût Unitaire HT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {selectedReception.lines?.map((line) => {
                                                const diff = Number(line.receivedQty) - Number(line.expectedQty);
                                                return (
                                                    <tr key={line.id} className="group hover:bg-gray-50/30">
                                                        <td className="px-8 py-6">
                                                            <div className="font-black text-gray-900 text-sm tracking-tight">{line.product?.name}</div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100 w-fit">{line.product?.sku}</div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center font-bold text-gray-400">
                                                            {line.expectedQty} <span className="text-[8px]">{line.unit}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="font-black text-gray-900 text-lg">{line.receivedQty}</span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {diff === 0 ? (
                                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Conforme</span>
                                                            ) : diff > 0 ? (
                                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Surplus (+{diff})</span>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 uppercase tracking-widest">Manquant ({diff})</span>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-gray-900">
                                                            {formatCurrency(line.unitCost, locale)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {selectedReception.status === 'DRAFT' && (
                                <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-[2rem] flex items-center gap-6 mb-4">
                                    <div className="h-12 w-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-rose-900 uppercase tracking-tighter">Action irréversible</p>
                                        <p className="text-[11px] font-medium text-rose-700/70 leading-relaxed">La validation entraînera une augmentation immédiate du stock et mettra à jour les prix d'achat.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex items-center justify-between sticky bottom-0 bg-white z-20">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-5 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:text-gray-900 transition-all active:scale-95"
                            >
                                {ct('close')}
                            </button>
                            
                            <div className="flex items-center gap-4">
                                {selectedReception.status === 'DRAFT' ? (
                                    <button 
                                        onClick={() => handleValidate(selectedReception.id)} 
                                        disabled={submitting}
                                        className="px-16 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black shadow-2xl shadow-emerald-200 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <><FileCheck size={20} /> Valider l'entrée en stock</>}
                                    </button>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-100 px-8 py-5 rounded-2xl flex items-center gap-3 text-emerald-600">
                                        <CheckCircle2 size={20} />
                                        <span className="font-black text-xs uppercase tracking-widest tracking-[0.2em]">Réception Confirmée</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
