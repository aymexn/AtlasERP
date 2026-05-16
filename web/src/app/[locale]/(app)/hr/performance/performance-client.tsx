'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Target, Plus, Award, TrendingUp, ChevronRight, Star,
    Loader2, Calendar, ArrowUpRight, CheckCircle2, Clock,
    FileText, X, Save, AlertCircle, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const REVIEW_STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-gray-50 text-gray-600 border-gray-100',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-100',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    FINALIZED: 'bg-blue-50 text-blue-700 border-blue-100',
};

const CYCLE_EMPTY = { name: '', startDate: '', endDate: '', description: '' };

export default function PerformanceClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [cycles, setCycles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCycle, setSelectedCycle] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ...CYCLE_EMPTY });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => { loadCycles(); }, []);
    useEffect(() => {
        if (toast) { const id = setTimeout(() => setToast(null), 4000); return () => clearTimeout(id); }
    }, [toast]);

    const loadCycles = async () => {
        try {
            const data = await hrService.listAppraisalCycles();
            setCycles(data || []);
            if (data?.length > 0) handleSelectCycle(data[0]);
        } catch { } finally { setLoading(false); }
    };

    const handleSelectCycle = async (cycle: any) => {
        setSelectedCycle(cycle);
        setLoadingReviews(true);
        try {
            const data = await hrService.getReviews(cycle.id);
            setReviews(data || []);
        } catch { } finally { setLoadingReviews(false); }
    };

    const handleCreateCycle = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await hrService.createAppraisalCycle(form);
            setToast({ type: 'success', message: 'Cycle d\'évaluation créé' });
            setShowModal(false);
            setForm({ ...CYCLE_EMPTY });
            await loadCycles();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors de la création' });
        } finally { setSaving(false); }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.finalRating || 0), 0) / reviews.filter(r => r.finalRating).length || 0).toFixed(1)
        : '—';

    const getCycleProgress = (cycle: any) => {
        if (!cycle?.startDate || !cycle?.endDate) return 0;
        const start = new Date(cycle.startDate).getTime();
        const end = new Date(cycle.endDate).getTime();
        const now = Date.now();
        return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-700' : 'bg-white border-rose-100 text-rose-700'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('performance.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                    <Plus size={20} /> Nouveau Cycle
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cycles d'évaluation</h3>
                    {cycles.length === 0 ? (
                        <div className="p-6 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                            <Target size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-xs text-slate-400 font-bold">Aucun cycle</p>
                            <button onClick={() => setShowModal(true)} className="text-blue-600 text-xs font-bold mt-2 hover:underline">+ Créer</button>
                        </div>
                    ) : cycles.map(c => {
                        const progress = getCycleProgress(c);
                        return (
                            <button key={c.id} onClick={() => handleSelectCycle(c)}
                                className={`w-full p-5 rounded-3xl border text-left transition-all group ${selectedCycle?.id === c.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-tighter">{c.name || 'Sans nom'}</span>
                                    <TrendingUp size={14} className={selectedCycle?.id === c.id ? 'text-blue-200' : 'text-slate-300'} />
                                </div>
                                {c.startDate && c.endDate && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold mb-3">
                                        <Calendar size={11} className={selectedCycle?.id === c.id ? 'text-blue-300' : 'text-slate-400'} />
                                        <span className={selectedCycle?.id === c.id ? 'text-blue-100' : 'text-slate-400'}>
                                            {format(new Date(c.startDate), 'dd/MM/yy')} — {format(new Date(c.endDate), 'dd/MM/yy')}
                                        </span>
                                    </div>
                                )}
                                <div className={`h-1.5 w-full rounded-full overflow-hidden ${selectedCycle?.id === c.id ? 'bg-blue-500' : 'bg-slate-100'}`}>
                                    <div className={`h-full rounded-full transition-all ${selectedCycle?.id === c.id ? 'bg-white/70' : 'bg-blue-400'}`} style={{ width: `${progress}%` }} />
                                </div>
                                <div className={`text-[10px] font-bold mt-1.5 ${selectedCycle?.id === c.id ? 'text-blue-200' : 'text-slate-400'}`}>{progress}% écoulé</div>
                            </button>
                        );
                    })}
                </div>

                {/* Main */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedCycle ? (
                        <>
                            {/* KPIs */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Évaluations', value: reviews.length, Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Complétées', value: reviews.filter(r => r.status === 'COMPLETED' || r.status === 'FINALIZED').length, Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'En cours', value: reviews.filter(r => r.status === 'DRAFT' || r.status === 'IN_PROGRESS').length, Icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                                ].map((k, i) => (
                                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                                            <p className="text-2xl font-black text-slate-900">{k.value}</p>
                                        </div>
                                        <div className={`h-11 w-11 ${k.bg} ${k.color} rounded-2xl flex items-center justify-center`}>
                                            <k.Icon size={22} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Note moyenne banner */}
                            {reviews.some(r => r.finalRating) && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-5 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Note Moyenne du Cycle</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-3xl font-black text-amber-700">{avgRating}</p>
                                            <div className="flex items-center gap-0.5 mt-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={16} className={s <= Math.round(parseFloat(avgRating as string)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <Award size={48} className="text-amber-200" />
                                </div>
                            )}

                            {/* Reviews Table */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <div>
                                        <h3 className="font-black text-slate-900">Évaluations</h3>
                                        <p className="text-[11px] text-slate-400 font-medium">{selectedCycle.name}</p>
                                    </div>
                                    <button className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">
                                        <ArrowUpRight size={13} /> Export Rapport
                                    </button>
                                </div>

                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            {['Employé', 'Évaluateur', 'Type', 'Statut', 'Note', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loadingReviews ? (
                                            <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={28} /></td></tr>
                                        ) : reviews.length === 0 ? (
                                            <tr><td colSpan={6} className="py-16 text-center">
                                                <Target size={36} className="mx-auto text-slate-200 mb-3" />
                                                <p className="text-slate-400 font-bold text-xs uppercase">Aucune évaluation dans ce cycle</p>
                                            </td></tr>
                                        ) : reviews.map(r => (
                                            <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                                            {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{r.employee?.firstName} {r.employee?.lastName}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{r.employee?.position || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm font-medium text-slate-600">
                                                    {r.reviewer?.firstName} {r.reviewer?.lastName}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.reviewType || 'Annuel'}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${REVIEW_STATUS_STYLES[r.status] || REVIEW_STATUS_STYLES.DRAFT}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} size={12} className={s <= (r.finalRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                                        ))}
                                                        {r.finalRating && <span className="text-[10px] font-black text-slate-500 ml-1">{r.finalRating}/5</span>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button className="p-1.5 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Target size={48} className="text-slate-200" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Sélectionnez un cycle d'évaluation</p>
                            <button onClick={() => setShowModal(true)} className="text-blue-600 text-sm font-bold hover:underline">+ Créer un nouveau cycle</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Cycle Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"><Target size={20} /></div>
                                <div>
                                    <h2 className="font-black text-slate-900">Nouveau Cycle</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Créer un cycle d'évaluation</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateCycle} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom du cycle *</label>
                                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="ex: Évaluation Annuelle 2026"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium" />
                            </div>
                            {[
                                { label: 'Date de début *', key: 'startDate' },
                                { label: 'Date de fin *', key: 'endDate' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                                    <input type="date" required value={(form as any)[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                                <textarea rows={3} value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Objectifs de ce cycle d'évaluation..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium resize-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl text-sm">Annuler</button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 text-sm disabled:opacity-60">
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
