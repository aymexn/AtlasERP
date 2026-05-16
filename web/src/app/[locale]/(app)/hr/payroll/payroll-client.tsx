'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Wallet, Plus, Calculator, Download, Eye, ChevronRight,
    CheckCircle2, Clock, AlertCircle, TrendingUp, Users,
    FileText, Loader2, Calendar, ArrowUpRight, X, Save
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-gray-50 text-gray-600 border-gray-100',
    PROCESSING: 'bg-amber-50 text-amber-700 border-amber-100',
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-100',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export default function PayrollClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [runs, setRuns] = useState<any[]>([]);
    const [loadingRuns, setLoadingRuns] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [form, setForm] = useState({
        periodStart: '', periodEnd: '', paymentDate: '', periodName: ''
    });

    useEffect(() => { loadPeriods(); }, []);
    useEffect(() => {
        if (toast) { const id = setTimeout(() => setToast(null), 4000); return () => clearTimeout(id); }
    }, [toast]);

    const loadPeriods = async () => {
        try {
            const data = await hrService.listPayrollPeriods();
            setPeriods(data || []);
            if (data?.length > 0) handleSelectPeriod(data[0]);
        } catch { } finally { setLoading(false); }
    };

    const handleSelectPeriod = async (period: any) => {
        setSelectedPeriod(period);
        setLoadingRuns(true);
        try {
            const data = await hrService.getPayrollRuns(period.id);
            setRuns(data || []);
        } catch { } finally { setLoadingRuns(false); }
    };

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const created = await hrService.createPayrollPeriod({
                periodStart: form.periodStart,
                periodEnd: form.periodEnd,
                paymentDate: form.paymentDate,
                periodName: form.periodName || `Paie ${format(new Date(form.periodStart), 'MMMM yyyy', { locale: fr })}`,
            });
            setToast({ type: 'success', message: 'Période de paie créée' });
            setShowModal(false);
            setForm({ periodStart: '', periodEnd: '', paymentDate: '', periodName: '' });
            await loadPeriods();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors de la création' });
        } finally { setSaving(false); }
    };

    const handleCalculate = async () => {
        if (!selectedPeriod) return;
        setCalculating(true);
        try {
            await hrService.calculatePayroll(selectedPeriod.id);
            setToast({ type: 'success', message: 'Paie calculée avec succès' });
            await handleSelectPeriod(selectedPeriod);
            await loadPeriods();
        } catch {
            setToast({ type: 'error', message: 'Erreur lors du calcul' });
        } finally { setCalculating(false); }
    };

    const handleDownloadPayslip = async (run: any) => {
        try {
            const filename = `Bulletin_${run.employee?.lastName}_${format(new Date(), 'MM_yyyy')}`;
            await hrService.downloadPayslip(run.id, filename);
        } catch {
            setToast({ type: 'error', message: 'Erreur lors du téléchargement' });
        }
    };

    const totals = runs.reduce((acc, r) => ({
        net: acc.net + Number(r.netSalary || 0),
        gross: acc.gross + Number(r.grossSalary || 0),
        deductions: acc.deductions + Number(r.totalDeductions || 0),
    }), { net: 0, gross: 0, deductions: 0 });

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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('payroll.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                    <Plus size={20} /> Nouvelle Période
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Periods Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Périodes de paie</h3>
                    {periods.length === 0 ? (
                        <div className="p-6 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                            <p className="text-xs text-slate-400 font-bold">Aucune période</p>
                            <button onClick={() => setShowModal(true)} className="text-blue-600 text-xs font-bold mt-2 hover:underline">+ Créer</button>
                        </div>
                    ) : periods.map(p => (
                        <button key={p.id} onClick={() => handleSelectPeriod(p)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedPeriod?.id === p.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black uppercase tracking-tighter">
                                    {p.periodName || format(new Date(p.periodStart), 'MMMM yyyy', { locale: fr })}
                                </span>
                                {p.status === 'PAID' ? <CheckCircle2 size={14} /> : <Clock size={14} className="opacity-60" />}
                            </div>
                            <div className={`text-[10px] font-bold ${selectedPeriod?.id === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                {format(new Date(p.periodStart), 'dd/MM')} — {format(new Date(p.periodEnd), 'dd/MM/yyyy')}
                            </div>
                            <div className={`mt-2 text-[9px] font-black uppercase tracking-widest inline-block px-2 py-0.5 rounded-full ${selectedPeriod?.id === p.id ? 'bg-blue-500 text-white' : STATUS_STYLES[p.status] || 'bg-gray-50 text-gray-600'}`}>
                                {p.status}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedPeriod ? (
                        <>
                            {/* KPIs */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: t('payroll.gross_salary'), value: formatCurrency(totals.gross), sub: `${runs.length} employés`, color: 'text-slate-900', bg: 'bg-white' },
                                    { label: 'Total Retenues', value: formatCurrency(totals.deductions), sub: `${totals.gross > 0 ? ((totals.deductions / totals.gross) * 100).toFixed(1) : 0}% du brut`, color: 'text-rose-600', bg: 'bg-rose-50/50 border-rose-100' },
                                    { label: t('payroll.net_to_pay'), value: formatCurrency(totals.net), sub: `${totals.gross > 0 ? ((totals.net / totals.gross) * 100).toFixed(1) : 0}% du brut`, color: 'text-blue-700', bg: 'bg-blue-50/60 border-blue-100' },
                                ].map((k, i) => (
                                    <div key={i} className={`${k.bg} p-5 rounded-3xl border border-slate-100 shadow-sm`}>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                                        <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{k.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <div>
                                        <h3 className="font-black text-slate-900">Bulletins de Paie</h3>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {format(new Date(selectedPeriod.periodStart), 'MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleCalculate} disabled={calculating || selectedPeriod.status === 'PAID'}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                                            {calculating ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                                            {runs.length > 0 ? 'Recalculer' : 'Calculer la paie'}
                                        </button>
                                        {runs.length > 0 && (
                                            <button className="flex items-center gap-2 bg-white border border-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 active:scale-95">
                                                <Download size={14} /> {t('payroll.generate_payslips')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {runs.length === 0 && !loadingRuns ? (
                                    <div className="py-16 text-center">
                                        <Wallet size={40} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Aucun bulletin généré</p>
                                        <p className="text-slate-300 text-[11px] mt-1">Cliquez sur "Calculer la paie" pour générer les bulletins</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                {['Employé', 'Salaire Brut', 'Retenues', 'Net à Payer', 'Statut', ''].map(h => (
                                                    <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loadingRuns ? (
                                                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={28} /></td></tr>
                                            ) : runs.map(run => (
                                                <tr key={run.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                                                {run.employee?.firstName?.[0]}{run.employee?.lastName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{run.employee?.firstName} {run.employee?.lastName}</p>
                                                                <p className="text-[10px] font-mono text-slate-400">{run.employee?.employeeCode}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-slate-700 text-sm">{formatCurrency(Number(run.grossSalary || 0))}</td>
                                                    <td className="px-5 py-4 font-bold text-rose-500 text-sm">-{formatCurrency(Number(run.totalDeductions || 0))}</td>
                                                    <td className="px-5 py-4 font-black text-blue-600 text-sm">{formatCurrency(Number(run.netSalary || 0))}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${STATUS_STYLES[run.status?.toUpperCase()] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                            {run.status || 'draft'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Eye size={15} /></button>
                                                            <button 
                                                                onClick={() => handleDownloadPayslip(run)}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Download size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Calendar size={48} className="text-slate-200" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Sélectionnez une période</p>
                            <button onClick={() => setShowModal(true)} className="text-blue-600 text-sm font-bold hover:underline">+ Créer une nouvelle période</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Period Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Wallet size={20} /></div>
                                <div>
                                    <h2 className="font-black text-slate-900">Nouvelle Période de Paie</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Définissez les dates de la période</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreatePeriod} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom de la période</label>
                                <input type="text" value={form.periodName} onChange={e => setForm({ ...form, periodName: e.target.value })}
                                    placeholder="ex: Paie Avril 2026"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium" />
                            </div>
                            {[
                                { label: 'Date de début *', key: 'periodStart' },
                                { label: 'Date de fin *', key: 'periodEnd' },
                                { label: 'Date de paiement *', key: 'paymentDate' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                                    <input type="date" required value={(form as any)[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 text-sm font-medium" />
                                </div>
                            ))}
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
