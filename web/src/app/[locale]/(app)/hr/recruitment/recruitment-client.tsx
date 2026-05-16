'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Plus, UserPlus, Briefcase, Clock, CheckCircle2, XCircle,
    Mail, Phone, MoreVertical, X, Save, Loader2, AlertCircle,
    MapPin, ChevronRight, Star, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STAGES = [
    { id: 'APPLIED', label: 'Candidatures', color: 'bg-slate-500', light: 'bg-slate-50 border-slate-200' },
    { id: 'SCREENING', label: 'Présélection', color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200' },
    { id: 'INTERVIEW', label: 'Entretien', color: 'bg-purple-500', light: 'bg-purple-50 border-purple-200' },
    { id: 'OFFER', label: 'Offre', color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200' },
    { id: 'HIRED', label: 'Recruté', color: 'bg-blue-600', light: 'bg-blue-50 border-blue-200' },
];

const JOB_EMPTY = { title: '', department: '', location: '', employmentType: 'FULL_TIME', description: '' };

export default function RecruitmentClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [jobs, setJobs] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'pipeline' | 'jobs'>('pipeline');
    const [showJobModal, setShowJobModal] = useState(false);
    const [form, setForm] = useState({ ...JOB_EMPTY });
    const [saving, setSaving] = useState(false);
    const [movingId, setMovingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => { loadData(); }, []);
    useEffect(() => {
        if (toast) { const id = setTimeout(() => setToast(null), 4000); return () => clearTimeout(id); }
    }, [toast]);

    const loadData = async () => {
        try {
            const [j, a] = await Promise.all([hrService.listJobs(), hrService.listApplications()]);
            setJobs(j || []);
            setApplications(a || []);
        } catch { } finally { setLoading(false); }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await hrService.createJob(form);
            setToast({ type: 'success', message: 'Offre publiée avec succès' });
            setShowJobModal(false);
            setForm({ ...JOB_EMPTY });
            await loadData();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors de la publication' });
        } finally { setSaving(false); }
    };

    const handleAdvanceStage = async (appId: string, currentStage: string) => {
        const idx = STAGES.findIndex(s => s.id === currentStage);
        if (idx >= STAGES.length - 1) return;
        const nextStage = STAGES[idx + 1].id;
        setMovingId(appId);
        try {
            await hrService.updateApplicationStage(appId, nextStage);
            setToast({ type: 'success', message: `Candidat avancé vers "${STAGES[idx + 1].label}"` });
            await loadData();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors du déplacement' });
        } finally { setMovingId(null); }
    };

    const handleHire = async (appId: string) => {
        setMovingId(appId);
        try {
            await hrService.hireCandidate(appId);
            setToast({ type: 'success', message: '🎉 Candidat recruté avec succès !' });
            await loadData();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors du recrutement' });
        } finally { setMovingId(null); }
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
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('recruitment.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-2xl flex">
                        {(['pipeline', 'jobs'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                {v === 'pipeline' ? 'PIPELINE' : 'OFFRES'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowJobModal(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <Plus size={20} /> Publier une offre
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {STAGES.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`h-2 w-2 rounded-full ${s.color}`} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{applications.filter(a => a.stage === s.id).length}</p>
                    </div>
                ))}
            </div>

            {view === 'pipeline' ? (
                <div className="flex gap-5 overflow-x-auto pb-6">
                    {STAGES.map(stage => (
                        <div key={stage.id} className="min-w-[280px] flex-1 flex flex-col gap-3">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">{stage.label}</h3>
                                </div>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {applications.filter(a => a.stage === stage.id).length}
                                </span>
                            </div>

                            <div className={`flex-1 min-h-[400px] space-y-3 p-3 rounded-3xl border-2 border-dashed ${stage.light}`}>
                                {applications.filter(a => a.stage === stage.id).map(app => (
                                    <div key={app.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm leading-tight">
                                                    {app.candidate?.firstName} {app.candidate?.lastName}
                                                </p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                                                    {app.jobPosting?.title}
                                                </p>
                                            </div>
                                            <div className={`h-2 w-2 rounded-full mt-1 ${stage.color}`} />
                                        </div>

                                        <div className="space-y-1.5 mb-4">
                                            {app.candidate?.email && (
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                    <Mail size={11} /> {app.candidate.email}
                                                </div>
                                            )}
                                            {app.candidate?.phone && (
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                    <Phone size={11} /> {app.candidate.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-slate-300 flex items-center gap-1">
                                                <Clock size={11} />
                                                {app.applicationDate ? format(new Date(app.applicationDate), 'dd MMM', { locale: fr }) : '—'}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {stage.id === 'HIRED' ? (
                                                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Recruté
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            disabled={movingId === app.id}
                                                            onClick={() => handleAdvanceStage(app.id, stage.id)}
                                                            className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {movingId === app.id ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
                                                            Avancer
                                                        </button>
                                                        {stage.id === 'OFFER' && (
                                                            <button
                                                                disabled={movingId === app.id}
                                                                onClick={() => handleHire(app.id)}
                                                                className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg hover:bg-emerald-100 transition-all flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 size={11} /> Recruter
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {applications.filter(a => a.stage === stage.id).length === 0 && (
                                    <div className="h-32 flex items-center justify-center opacity-20">
                                        <UserPlus size={40} className="text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {['Offre d\'emploi', 'Département', 'Type', 'Candidats', 'Statut'].map(h => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {jobs.length === 0 ? (
                                <tr><td colSpan={5} className="py-16 text-center">
                                    <Briefcase size={36} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 font-bold text-xs uppercase">Aucune offre publiée</p>
                                    <button onClick={() => setShowJobModal(true)} className="text-blue-600 text-xs font-bold mt-2 hover:underline">+ Publier une offre</button>
                                </td></tr>
                            ) : jobs.map(job => (
                                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{job.title}</p>
                                        {job.location && <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5"><MapPin size={10} />{job.location}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{job.department || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{job.employmentType || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs">
                                            {job._count?.applications ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Job Modal */}
            {showJobModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowJobModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Briefcase size={20} /></div>
                                <div>
                                    <h2 className="font-black text-slate-900">Publier une Offre</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Nouveau poste à pourvoir</p>
                                </div>
                            </div>
                            <button onClick={() => setShowJobModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {[
                                { label: 'Intitulé du poste *', key: 'title', required: true },
                                { label: 'Département', key: 'department' },
                                { label: 'Localisation', key: 'location' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                                    <input type="text" required={f.required} value={(form as any)[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de contrat</label>
                                <select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium">
                                    {[['FULL_TIME', 'Temps plein'], ['PART_TIME', 'Temps partiel'], ['CONTRACT', 'CDD'], ['INTERNSHIP', 'Stage']].map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description du poste *</label>
                                <textarea required rows={5} value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Décrivez les responsabilités, prérequis, etc."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium resize-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowJobModal(false)}
                                    className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl text-sm">Annuler</button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 text-sm disabled:opacity-60">
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Publier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
