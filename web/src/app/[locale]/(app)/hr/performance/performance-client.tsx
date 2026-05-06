'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Target,
    Plus,
    Award,
    TrendingUp,
    Users,
    ChevronRight,
    Star,
    Loader2,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PerformanceClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [cycles, setCycles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCycle, setSelectedCycle] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        loadCycles();
    }, []);

    const loadCycles = async () => {
        try {
            const data = await hrService.listAppraisalCycles();
            setCycles(data || []);
            if (data?.length > 0) {
                handleSelectCycle(data[0]);
            }
        } catch (err) {
            console.error('Failed to load cycles', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCycle = async (cycle: any) => {
        setSelectedCycle(cycle);
        setLoadingReviews(true);
        try {
            const data = await hrService.getReviews(cycle.id);
            setReviews(data || []);
        } catch (err) {
            console.error('Failed to load reviews', err);
        } finally {
            setLoadingReviews(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('performance.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <Plus size={20} />
                        Nouveau Cycle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Cycles Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cycles d'évaluation</h3>
                    <div className="space-y-2">
                        {cycles.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleSelectCycle(c)}
                                className={`w-full p-5 rounded-3xl border text-left transition-all group ${
                                    selectedCycle?.id === c.id 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' 
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-tighter">
                                        {c.name || 'Cycle sans nom'}
                                    </span>
                                    <TrendingUp size={14} className={selectedCycle?.id === c.id ? 'text-blue-100' : 'text-slate-300'} />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold">
                                    <Calendar size={12} className={selectedCycle?.id === c.id ? 'text-blue-200' : 'text-slate-400'} />
                                    <span className={selectedCycle?.id === c.id ? 'text-blue-100' : 'text-slate-400'}>
                                        {format(new Date(c.startDate), 'dd/MM/yy')} — {format(new Date(c.endDate), 'dd/MM/yy')}
                                    </span>
                                </div>
                                <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${selectedCycle?.id === c.id ? 'bg-blue-500' : 'bg-slate-100'}`}>
                                    <div className={`h-full bg-white transition-all`} style={{ width: '45%' }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    {selectedCycle && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Évaluations</p>
                                        <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <FileText size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Complétées</p>
                                        <p className="text-2xl font-black text-slate-900">{reviews.filter(r => r.status === 'COMPLETED').length}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Note Moyenne</p>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-2xl font-black text-slate-900">4.2</p>
                                            <Star size={16} className="text-amber-400 fill-amber-400 mb-1" />
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                        <Award size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Table */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <h3 className="font-black text-slate-900 tracking-tight">Liste des Évaluations</h3>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-blue-100 active:scale-95">
                                            <ArrowUpRight size={14} />
                                            Export Rapport
                                        </button>
                                    </div>
                                </div>

                                <div className="p-1">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employé</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Évaluateur</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Note</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loadingReviews ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center">
                                                        <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
                                                    </td>
                                                </tr>
                                            ) : reviews.map((r) => (
                                                <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                                                        {r.employee.firstName} {r.employee.lastName}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                        {r.reviewer.firstName} {r.reviewer.lastName}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${
                                                            r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            r.status === 'DRAFT' ? 'bg-gray-50 text-gray-700 border-gray-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star 
                                                                    key={s} 
                                                                    size={12} 
                                                                    className={s <= (r.finalRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} 
                                                                />
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
