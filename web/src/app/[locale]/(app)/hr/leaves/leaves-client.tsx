'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Calendar as CalendarIcon,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Filter,
    Loader2,
    FileText,
    User,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function LeavesClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'calendar'>('list');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await hrService.listLeaveRequests();
            setRequests(data || []);
        } catch (err) {
            console.error('Failed to load leaves', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'APPROVED_BY_MANAGER': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
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
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('leaves.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-2xl flex">
                        <button 
                            onClick={() => setView('list')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            LISTE
                        </button>
                        <button 
                            onClick={() => setView('calendar')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            CALENDRIER
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <Plus size={20} />
                        {t('leaves.request')}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 text-white flex items-center justify-between overflow-hidden relative group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">En attente d'approbation</p>
                        <p className="text-3xl font-black">{requests.filter(r => r.status === 'PENDING').length}</p>
                    </div>
                    <Clock size={64} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absences ce jour</p>
                        <p className="text-3xl font-black text-slate-900">3</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CalendarIcon size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Moyenne mensuelle</p>
                        <p className="text-3xl font-black text-slate-900">2.4 <span className="text-sm font-bold text-slate-300">j/empl.</span></p>
                    </div>
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Demandes récentes</h3>
                    <div className="flex gap-2">
                         <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Filter size={20}/></button>
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {requests.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FileText size={32} />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune demande trouvée</p>
                        </div>
                    ) : (
                        requests.map((r) => (
                            <div key={r.id} className="p-6 flex flex-wrap items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <User size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{r.employee.firstName} {r.employee.lastName}</span>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{r.leaveType.name}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Période</span>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            {format(new Date(r.startDate), 'dd MMM', { locale: fr })}
                                            <ChevronRight size={12} className="text-slate-300" />
                                            {format(new Date(r.endDate), 'dd MMM yyyy', { locale: fr })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Durée</span>
                                        <span className="text-sm font-black text-blue-600">{r.totalDays} Jours</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest shadow-sm ${getStatusStyle(r.status)}`}>
                                        {t(`leaves.${r.status.toLowerCase()}`)}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {r.status === 'PENDING' && (
                                            <>
                                                <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100 bg-white" title="Approuver">
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-rose-100 bg-white" title="Refuser">
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
