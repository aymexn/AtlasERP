'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Wallet,
    Plus,
    Calculator,
    Download,
    Eye,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    FileText,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PayrollClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [runs, setRuns] = useState<any[]>([]);
    const [loadingRuns, setLoadingRuns] = useState(false);

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        try {
            const data = await hrService.listPayrollPeriods();
            setPeriods(data || []);
            if (data?.length > 0) {
                handleSelectPeriod(data[0]);
            }
        } catch (err) {
            console.error('Failed to load periods', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPeriod = async (period: any) => {
        setSelectedPeriod(period);
        setLoadingRuns(true);
        try {
            const data = await hrService.getPayrollRuns(period.id);
            setRuns(data || []);
        } catch (err) {
            console.error('Failed to load runs', err);
        } finally {
            setLoadingRuns(false);
        }
    };

    const calculateTotals = () => {
        return runs.reduce((acc, run) => ({
            net: acc.net + Number(run.netSalary || 0),
            gross: acc.gross + Number(run.grossSalary || 0),
            employer: acc.employer + Number(run.employerCost || 0)
        }), { net: 0, gross: 0, employer: 0 });
    };

    const totals = calculateTotals();

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
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('payroll.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <Plus size={20} />
                        Nouvelle Période
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Periods Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Historique des périodes</h3>
                    <div className="space-y-2">
                        {periods.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handleSelectPeriod(p)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                                    selectedPeriod?.id === p.id 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-black uppercase tracking-tighter">
                                        {format(new Date(p.periodStart), 'MMMM yyyy', { locale: fr })}
                                    </span>
                                    {p.status === 'PAID' ? <CheckCircle2 size={14} /> : <Clock size={14} className="opacity-60" />}
                                </div>
                                <div className={`text-[10px] font-bold ${selectedPeriod?.id === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {format(new Date(p.periodStart), 'dd/MM')} — {format(new Date(p.periodEnd), 'dd/MM/yyyy')}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    {selectedPeriod && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('payroll.gross_salary')}</p>
                                    <p className="text-2xl font-black text-slate-900">{formatCurrency(totals.gross, locale)}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-500">
                                        <ArrowUpRight size={12} />
                                        <span>+4.2% vs mois dernier</span>
                                    </div>
                                    <TrendingUp size={48} className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
                                    <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">{t('payroll.net_to_pay')}</p>
                                    <p className="text-2xl font-black text-blue-700">{formatCurrency(totals.net, locale)}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-500">
                                        <ArrowDownRight size={12} />
                                        <span>75.4% du brut</span>
                                    </div>
                                    <Wallet size={48} className="absolute -right-4 -bottom-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coût Employeur</p>
                                    <p className="text-2xl font-black text-slate-900">{formatCurrency(totals.employer, locale)}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <Users size={12} />
                                        <span>{runs.length} Employés concernés</span>
                                    </div>
                                    <TrendingUp size={48} className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 group-hover:scale-110 transition-transform" />
                                </div>
                            </div>

                            {/* Actions Header */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                                            <Calculator size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 tracking-tight">Détails de la Paie</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                {format(new Date(selectedPeriod.periodStart), 'MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                                            <Calculator size={14} />
                                            Recalculer
                                        </button>
                                        <button className="flex items-center gap-2 bg-white border border-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-slate-50 active:scale-95">
                                            <Download size={14} />
                                            {t('payroll.generate_payslips')}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-1">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employé</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salaire Brut</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retenues</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net à Payer</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loadingRuns ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center">
                                                        <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
                                                    </td>
                                                </tr>
                                            ) : runs.map((run) => (
                                                <tr key={run.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                                                {run.employee.firstName[0]}{run.employee.lastName[0]}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 text-sm">{run.employee.firstName} {run.employee.lastName}</span>
                                                                <span className="text-[10px] font-mono text-slate-400">{run.employee.employeeCode}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-slate-700">{formatCurrency(Number(run.grossSalary), locale)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-rose-500">-{formatCurrency(Number(run.totalDeductions), locale)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-black text-blue-600">{formatCurrency(Number(run.netSalary), locale)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Détails">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Télécharger Bulletin">
                                                                <Download size={16} />
                                                            </button>
                                                        </div>
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
