'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Calendar as CalendarIcon, Plus, Clock, CheckCircle2, XCircle,
    Filter, Loader2, FileText, User, ChevronRight, AlertCircle,
    MoreVertical, X, Save, Info
} from 'lucide-react';
import { format, differenceInBusinessDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
    APPROVED_BY_MANAGER: 'bg-blue-50 text-blue-700 border-blue-100',
    CANCELLED: 'bg-gray-50 text-gray-700 border-gray-100',
};

const STATUS_LABELS: Record<string, string> = {
    APPROVED: 'Approuvé', PENDING: 'En attente', REJECTED: 'Refusé',
    APPROVED_BY_MANAGER: 'Validé Manager', CANCELLED: 'Annulé',
};

const EMPTY_FORM = {
    employeeId: '', leaveTypeId: '', startDate: '', endDate: '',
    reason: '', handoverNotes: '',
};

export default function LeavesClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [requests, setRequests] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => { loadAll(); }, []);
    useEffect(() => {
        if (toast) { const id = setTimeout(() => setToast(null), 4000); return () => clearTimeout(id); }
    }, [toast]);

    const loadAll = async () => {
        try {
            const [reqs, types, emps] = await Promise.all([
                hrService.listLeaveRequests(),
                hrService.listLeaveTypes(),
                hrService.listEmployees(),
            ]);
            setRequests(reqs || []);
            setLeaveTypes(types || []);
            setEmployees(emps || []);
        } catch (err) {
            console.error('Failed to load leaves data', err);
        } finally {
            setLoading(false);
        }
    };

    const calcDays = () => {
        if (!form.startDate || !form.endDate) return 0;
        const diff = differenceInBusinessDays(new Date(form.endDate), new Date(form.startDate)) + 1;
        return Math.max(0, diff);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.startDate || !form.endDate || !form.leaveTypeId) {
            setToast({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' });
            return;
        }
        setSaving(true);
        try {
            await hrService.requestLeave({
                leaveTypeId: form.leaveTypeId,
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason,
                handoverNotes: form.handoverNotes,
            });
            setToast({ type: 'success', message: 'Demande de congé soumise avec succès' });
            setShowModal(false);
            setForm({ ...EMPTY_FORM });
            await loadAll();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors de la soumission' });
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await hrService.approveLeave(id, 'manager');
            setToast({ type: 'success', message: 'Demande approuvée' });
            await loadAll();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors de l\'approbation' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            await hrService.rejectLeave(id, 'Refus par manager');
            setToast({ type: 'success', message: 'Demande refusée' });
            await loadAll();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors du refus' });
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = requests.filter(r =>
        statusFilter === 'all' || r.status === statusFilter
    );

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
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold transition-all ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-700' : 'bg-white border-rose-100 text-rose-700'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('leaves.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-2xl flex">
                        {(['list', 'calendar'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                {v === 'list' ? 'LISTE' : 'CALENDRIER'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
                    >
                        <Plus size={20} /> {t('leaves.request')}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'En attente', value: requests.filter(r => r.status === 'PENDING').length, color: 'bg-amber-600', shadow: 'shadow-amber-200', icon: Clock },
                    { label: 'Approuvées', value: requests.filter(r => r.status === 'APPROVED').length, color: 'bg-emerald-600', shadow: 'shadow-emerald-200', icon: CheckCircle2 },
                    { label: 'Refusées', value: requests.filter(r => r.status === 'REJECTED').length, color: 'bg-rose-600', shadow: 'shadow-rose-200', icon: XCircle },
                    { label: 'Total demandes', value: requests.length, color: 'bg-blue-600', shadow: 'shadow-blue-200', icon: FileText },
                ].map((s, i) => (
                    <div key={i} className={`${s.color} p-6 rounded-3xl shadow-xl ${s.shadow} text-white flex items-center justify-between overflow-hidden relative group`}>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-3xl font-black">{s.value}</p>
                        </div>
                        <s.icon size={56} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <Filter size={16} className="text-slate-400" />
                {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                        {{ all: 'Toutes', PENDING: 'En attente', APPROVED: 'Approuvées', REJECTED: 'Refusées' }[s]}
                    </button>
                ))}
            </div>

            {/* Requests */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Demandes de Congé</h3>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{filtered.length} demandes</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {filtered.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FileText size={32} />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune demande trouvée</p>
                        </div>
                    ) : filtered.map(r => (
                        <div key={r.id} className="p-5 flex flex-wrap items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                            {/* Employee */}
                            <div className="flex items-center gap-3 min-w-[200px] flex-1">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-black text-xs flex-shrink-0">
                                    {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{r.employee?.firstName} {r.employee?.lastName}</p>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{r.leaveType?.name}</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Période</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        {format(new Date(r.startDate), 'dd MMM', { locale: fr })}
                                        <ChevronRight size={12} className="text-slate-300" />
                                        {format(new Date(r.endDate), 'dd MMM yyyy', { locale: fr })}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Durée</p>
                                    <span className="text-sm font-black text-blue-600">{r.totalDays} j</span>
                                </div>
                            </div>

                            {/* Status + Actions */}
                            <div className="flex items-center gap-3 ml-auto">
                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${STATUS_STYLES[r.status] || ''}`}>
                                    {STATUS_LABELS[r.status] || r.status}
                                </span>
                                {r.status === 'PENDING' && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            disabled={actionLoading === r.id}
                                            onClick={() => handleApprove(r.id)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100 bg-white disabled:opacity-50"
                                            title="Approuver"
                                        >
                                            {actionLoading === r.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                        </button>
                                        <button
                                            disabled={actionLoading === r.id}
                                            onClick={() => handleReject(r.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-rose-100 bg-white disabled:opacity-50"
                                            title="Refuser"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leave Types Reference */}
            {leaveTypes.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Types de congés disponibles</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {leaveTypes.map(lt => (
                            <div key={lt.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: lt.color || '#3b82f6' }} />
                                <div>
                                    <p className="text-xs font-bold text-slate-700">{lt.name}</p>
                                    {lt.accrualRate > 0 && <p className="text-[10px] text-slate-400">{lt.accrualRate} j/mois</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Leave Request Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <CalendarIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900">Demande de Congé</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Nouvelle demande d'absence</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Leave Type */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de congé *</label>
                                <select
                                    required
                                    value={form.leaveTypeId}
                                    onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800"
                                >
                                    <option value="">Sélectionner un type...</option>
                                    {leaveTypes.map(lt => (
                                        <option key={lt.id} value={lt.id}>{lt.name} {lt.isPaid ? '(Payé)' : '(Non payé)'}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date de début *</label>
                                    <input type="date" required value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date de fin *</label>
                                    <input type="date" required value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800" />
                                </div>
                            </div>

                            {/* Days indicator */}
                            {form.startDate && form.endDate && (
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <Info size={16} className="text-blue-600 flex-shrink-0" />
                                    <p className="text-sm font-bold text-blue-700">
                                        Durée estimée: <span className="font-black">{calcDays()} jour(s) ouvrable(s)</span>
                                    </p>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Motif</label>
                                <textarea
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    rows={3}
                                    placeholder="Motif de l'absence (optionnel)..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800 resize-none"
                                />
                            </div>

                            {/* Handover notes */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Note de passation</label>
                                <textarea
                                    value={form.handoverNotes}
                                    onChange={e => setForm({ ...form, handoverNotes: e.target.value })}
                                    rows={2}
                                    placeholder="Instructions pour votre remplaçant..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all text-sm">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm disabled:opacity-60">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Soumettre
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
