'use client';

import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, X, Loader2, AlertCircle, CheckCircle2, 
    Truck, Package, Info, Wand2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatNumber } from '@/lib/format';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';

interface PurchaseSuggestion {
    productId: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    committedStock: number;
    neededForMO: number;
    availableStock: number;
    suggestedQuantity: number;
    preferredSupplierId: string | null;
    supplierName: string | null;
    unit: string;
    unitPriceHt: number;
    isCritical: boolean;
}

interface PurchaseNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PurchaseNeedModal({ isOpen, onClose, onSuccess }: PurchaseNeedModalProps) {
    const t = useTranslations('manufacturing_orders');
    const ct = useTranslations('common');
    const router = useRouter();
    
    const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSuggestions();
        }
    }, [isOpen]);
    const loadSuggestions = async () => {
        try {
            setLoading(true);
            const url = '/api/purchases/needs';
            console.log(`FETCH START: calling ${window.location.origin}${url}`);
            const res = await fetch(url);
            console.log(`FETCH STATUS: ${res.status} ${res.statusText}`);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();
            console.log("Suggestions reçues de l'API:", data);
            setSuggestions(data);
            setSelectedIds(new Set(data.map((s: any) => s.productId)));
        } catch (error) {
            console.error(error);
            toast.error(ct('error'));
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === suggestions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(suggestions.map(s => s.productId)));
        }
    };

    const updateQty = (id: string, qty: string) => {
        const num = parseFloat(qty) || 0;
        setSuggestions(prev => prev.map(s => s.productId === id ? { ...s, suggestedQuantity: num } : s));
    };

    const handleGenerate = async () => {
        const selectedItems = suggestions.filter(s => selectedIds.has(s.productId));
        if (selectedItems.length === 0) {
            toast.error(t('select_at_least_one'));
            return;
        }

        try {
            setGenerating(true);
            const res = await fetch('/api/purchases/needs/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedItems)
            });

            if (!res.ok) throw new Error('Failed to generate POs');
            const data = await res.json();
            toast.success(data.message);
            onSuccess();
            onClose();
            router.push('/purchases/orders');
        } catch (error) {
            console.error(error);
            toast.error(ct('error'));
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-4xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200/50 animate-in zoom-in-95 duration-300">
                {/* Header - AtlasElite Style */}
                <div className="p-8 bg-white flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                {t('purchase_need_title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                {t('purchase_need_subtitle')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="h-12 w-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:text-rose-500 transition-colors shadow-sm border border-slate-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                            <div className="relative">
                                <Loader2 className="animate-spin text-blue-600" size={64} />
                                <ShoppingCart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-200" size={24} />
                            </div>
                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">{t('analyzing_stock')}</p>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-4xl border border-slate-100 shadow-sm">
                            <div className="h-24 w-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                <AlertCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Aucun besoin détecté</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-3 font-medium">
                                L'API a renvoyé 0 résultats pour la compagnie 61324390-5b8f-488f-a287-fe3dd79bdeee.
                                <br />
                                <span className="text-xs text-slate-400 mt-2 block italic">Vérifiez les logs du serveur pour plus de détails.</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <div className="flex items-center gap-6">
                                    <button 
                                        onClick={toggleSelectAll}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
                                    >
                                        {selectedIds.size === suggestions.length ? ct('deselect_all') : ct('select_all')}
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em]">
                                            {suggestions.length} {t('items_flagged')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-4xl overflow-hidden shadow-xl shadow-slate-200/40">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-5 w-16"></th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('product')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t('current_stock')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t('min_stock')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t('suggested_qty')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('supplier')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {suggestions.map((s) => (
                                            <tr key={s.productId} className={`hover:bg-slate-50/30 transition-all ${selectedIds.has(s.productId) ? 'bg-blue-50/20' : ''} ${s.isCritical ? 'bg-rose-50/10' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <input 
                                                        type="checkbox" 
                                                        className={`h-6 w-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all ${s.isCritical ? 'border-rose-300' : ''}`}
                                                        checked={selectedIds.has(s.productId)}
                                                        onChange={() => toggleSelect(s.productId)}
                                                    />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-black text-slate-900 text-base">{s.name}</div>
                                                            {s.isCritical && (
                                                                <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full uppercase tracking-tighter animate-pulse shadow-sm shadow-rose-200">
                                                                    CRITIQUE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded w-fit">{s.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className={`text-lg font-black ${s.currentStock < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                                                        {formatNumber(s.currentStock)}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{s.unit}</div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-slate-500 font-bold">
                                                    {formatNumber(s.minStock)}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="inline-flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                                        <input 
                                                            type="number"
                                                            value={s.suggestedQuantity}
                                                            onChange={(e) => updateQty(s.productId, e.target.value)}
                                                            className="w-20 bg-white border border-slate-100 rounded-xl px-3 py-2 text-center font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                                                        />
                                                        <span className="text-[10px] font-black text-slate-400 pr-2">{s.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {s.supplierName ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">
                                                                <Truck size={18} />
                                                            </div>
                                                            <span className="text-sm font-black text-slate-700">{s.supplierName}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2 w-fit">
                                                            <AlertCircle size={14} />
                                                            {t('no_supplier')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {s.preferredSupplierId ? (
                                                        <Link 
                                                            href={{ pathname: '/purchases/orders', query: { productId: s.productId, qty: s.suggestedQuantity } } as any}
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 group shadow-sm shadow-blue-100"
                                                            title="Créer un Bon de Commande pour cet article"
                                                        >
                                                            <ShoppingCart size={14} className="group-hover:scale-110 transition-transform" />
                                                            Buy
                                                        </Link>
                                                    ) : (
                                                        <div 
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed bg-slate-50/50"
                                                            title="Veuillez assigner un fournisseur préféré dans la fiche produit"
                                                        >
                                                            <ShoppingCart size={14} />
                                                            Buy
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - High Impact Actions */}
                <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-slate-900">{selectedIds.size}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('selected_items')}</span>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-blue-600">
                                {suggestions.filter(s => selectedIds.has(s.productId)).length > 0 
                                    ? new Set(suggestions.filter(s => selectedIds.has(s.productId)).map(s => s.preferredSupplierId)).size 
                                    : 0}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Grouped BCFs</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onClose}
                            className="px-10 py-4 bg-white text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            {ct('cancel')}
                        </button>
                        <button 
                            disabled={selectedIds.size === 0 || generating}
                            onClick={handleGenerate}
                            className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 group"
                        >
                            {generating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />}
                            {t('generate_pos')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
