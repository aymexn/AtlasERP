'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService, Employee } from '@/services/hr';
import {
    Plus, Search, Edit2, Users, UserPlus, UserCheck,
    Clock, Filter, Loader2, Building2, Mail, Phone,
    Calendar, Briefcase, ChevronRight, X, Save,
    AlertCircle, CheckCircle2, MapPin, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    ON_LEAVE: 'bg-blue-50 text-blue-700 border-blue-100',
    SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-100',
    TERMINATED: 'bg-rose-50 text-rose-700 border-rose-100',
};

const EMPTY_FORM = {
    firstName: '', lastName: '', email: '', phone: '',
    position: '', department: '', hireDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time', baseSalary: '', currency: 'DA', salaryType: 'monthly',
    address: '', city: '', nationality: 'Algérienne', gender: 'M',
    socialSecurityNumber: '', taxId: '', bankName: '', bankAccountIban: '',
    emergencyContactName: '', emergencyContactPhone: '',
    // Contract
    contractType: 'CDI', contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '', weeklyHours: '40', probationMonths: '3',
};

type FormTab = 'personal' | 'employment' | 'contract' | 'bank';

export default function EmployeesClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formTab, setFormTab] = useState<FormTab>('personal');
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => { loadEmployees(); }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
    }, [toast]);

    const loadEmployees = async () => {
        try {
            const data = await hrService.listEmployees();
            setEmployees(data || []);
        } catch (err) {
            console.error('Failed to load employees', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await hrService.createEmployee({
                firstName: form.firstName, lastName: form.lastName,
                email: form.email, phone: form.phone,
                position: form.position, department: form.department,
                hireDate: form.hireDate, employmentType: form.employmentType,
                baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : null,
                currency: form.currency, salaryType: form.salaryType,
                address: form.address, city: form.city,
                nationality: form.nationality, gender: form.gender,
                socialSecurityNumber: form.socialSecurityNumber, taxId: form.taxId,
                bankName: form.bankName, bankAccountIban: form.bankAccountIban,
                emergencyContactName: form.emergencyContactName,
                emergencyContactPhone: form.emergencyContactPhone,
                contract: {
                    contractType: form.contractType,
                    startDate: form.contractStartDate,
                    endDate: form.contractEndDate || null,
                    workingHoursPerWeek: form.weeklyHours ? parseFloat(form.weeklyHours) : null,
                    salaryBaseAmount: form.baseSalary ? parseFloat(form.baseSalary) : 0,
                    probationMonths: form.probationMonths ? parseInt(form.probationMonths) : null,
                }
            });
            setToast({ type: 'success', message: 'Employé créé avec succès' });
            setShowModal(false);
            setForm({ ...EMPTY_FORM });
            setFormTab('personal');
            await loadEmployees();
        } catch {
            setToast({ type: 'error', message: "Erreur lors de la création de l'employé" });
        } finally {
            setSaving(false);
        }
    };

    const filtered = employees.filter(e => {
        const name = `${e.firstName} ${e.lastName}`.toLowerCase();
        const match = name.includes(searchTerm.toLowerCase()) ||
            e.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || e.status === statusFilter;
        return match && statusMatch;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    const tabClass = (tab: FormTab) =>
        `px-4 py-2 text-xs font-black rounded-xl transition-all ${formTab === tab ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`;

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
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('employees.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
                >
                    <UserPlus size={20} /> {t('employees.add')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Effectif', value: employees.length, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Actifs', value: employees.filter(e => e.status === 'ACTIVE').length, Icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'En Congé', value: employees.filter(e => e.status === 'ON_LEAVE').length, Icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Départements', value: new Set(employees.map(e => e.department).filter(Boolean)).size, Icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                        </div>
                        <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                            <s.Icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters + Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('employees.search')}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-200 text-sm font-bold text-slate-500"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="ACTIVE">Actif</option>
                            <option value="ON_LEAVE">En Congé</option>
                            <option value="SUSPENDED">Suspendu</option>
                            <option value="TERMINATED">Sorti</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {['Employé', 'Poste & Dépt', 'Contact', 'Date embauche', 'Statut', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <Users size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun employé trouvé</p>
                                            <button onClick={() => setShowModal(true)} className="text-blue-600 text-xs font-bold hover:underline mt-1">+ Ajouter le premier employé</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(e => (
                                <tr key={e.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                                                {e.firstName[0]}{e.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{e.firstName} {e.lastName}</p>
                                                <p className="text-[10px] font-mono text-slate-400 uppercase">{e.employeeCode || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                            <Briefcase size={13} className="text-slate-300" />
                                            <span className="text-sm font-bold">{e.position || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                                            <Building2 size={11} />
                                            <span className="text-[11px] font-medium">{e.department || 'Non assigné'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {e.email && <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium"><Mail size={11} className="text-slate-300" />{e.email}</div>}
                                        {e.phone && <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5"><Phone size={11} className="text-slate-300" />{e.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                            <Calendar size={12} className="text-slate-300" />
                                            {format(new Date(e.hireDate), 'dd MMM yyyy', { locale: fr })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${STATUS_STYLES[e.status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                            {e.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-blue-100 shadow-sm transition-all">
                                                <Edit2 size={15} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all">
                                                <ChevronRight size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Employee Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900">Nouvel Employé</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Remplissez les informations de base et le contrat</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="bg-slate-50 px-6 py-3 flex gap-1 border-b border-slate-100">
                            {(['personal', 'employment', 'contract', 'bank'] as FormTab[]).map(tab => (
                                <button key={tab} onClick={() => setFormTab(tab)} className={tabClass(tab)}>
                                    {{ personal: 'Personnel', employment: 'Poste', contract: 'Contrat', bank: 'Banque' }[tab]}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                            {formTab === 'personal' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Prénom *" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} required />
                                    <InputField label="Nom *" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} required />
                                    <InputField label="Email *" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required />
                                    <InputField label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                                    <SelectField label="Genre" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} />
                                    <InputField label="Nationalité" value={form.nationality} onChange={v => setForm({ ...form, nationality: v })} />
                                    <InputField label="Adresse" value={form.address} onChange={v => setForm({ ...form, address: v })} className="col-span-2" />
                                    <InputField label="Ville" value={form.city} onChange={v => setForm({ ...form, city: v })} />
                                    <InputField label="N° Sécurité Sociale" value={form.socialSecurityNumber} onChange={v => setForm({ ...form, socialSecurityNumber: v })} />
                                    <InputField label="Contact Urgence - Nom" value={form.emergencyContactName} onChange={v => setForm({ ...form, emergencyContactName: v })} />
                                    <InputField label="Contact Urgence - Tél" value={form.emergencyContactPhone} onChange={v => setForm({ ...form, emergencyContactPhone: v })} />
                                </div>
                            )}
                            {formTab === 'employment' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Intitulé du poste *" value={form.position} onChange={v => setForm({ ...form, position: v })} required className="col-span-2" />
                                    <InputField label="Département" value={form.department} onChange={v => setForm({ ...form, department: v })} />
                                    <InputField label="Date d'embauche *" type="date" value={form.hireDate} onChange={v => setForm({ ...form, hireDate: v })} required />
                                    <SelectField label="Type d'emploi" value={form.employmentType} onChange={v => setForm({ ...form, employmentType: v })}
                                        options={[
                                            { value: 'full_time', label: 'Temps plein' },
                                            { value: 'part_time', label: 'Temps partiel' },
                                            { value: 'contract', label: 'CDD / Contrat' },
                                            { value: 'intern', label: 'Stagiaire' },
                                        ]}
                                    />
                                    <InputField label="Salaire de base" type="number" value={form.baseSalary} onChange={v => setForm({ ...form, baseSalary: v })} />
                                    <SelectField label="Périodicité" value={form.salaryType} onChange={v => setForm({ ...form, salaryType: v })}
                                        options={[
                                            { value: 'monthly', label: 'Mensuel' },
                                            { value: 'hourly', label: 'Horaire' },
                                            { value: 'daily', label: 'Journalier' },
                                        ]}
                                    />
                                </div>
                            )}
                            {formTab === 'contract' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <SelectField label="Type de contrat *" value={form.contractType} onChange={v => setForm({ ...form, contractType: v })}
                                        options={[
                                            { value: 'CDI', label: 'CDI — Indéterminée' },
                                            { value: 'CDD', label: 'CDD — Durée Déterminée' },
                                            { value: 'APPRENTICESHIP', label: 'Apprentissage' },
                                            { value: 'INTERNSHIP', label: 'Stage' },
                                        ]}
                                    />
                                    <InputField label="Heures/semaine" type="number" value={form.weeklyHours} onChange={v => setForm({ ...form, weeklyHours: v })} />
                                    <InputField label="Début du contrat *" type="date" value={form.contractStartDate} onChange={v => setForm({ ...form, contractStartDate: v })} required />
                                    <InputField label="Fin du contrat" type="date" value={form.contractEndDate} onChange={v => setForm({ ...form, contractEndDate: v })} />
                                    <InputField label="Période d'essai (mois)" type="number" value={form.probationMonths} onChange={v => setForm({ ...form, probationMonths: v })} />
                                    <InputField label="NIF (Identifiant Fiscal)" value={form.taxId} onChange={v => setForm({ ...form, taxId: v })} />
                                </div>
                            )}
                            {formTab === 'bank' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Banque" value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} className="col-span-2" />
                                    <InputField label="IBAN / RIB" value={form.bankAccountIban} onChange={v => setForm({ ...form, bankAccountIban: v })} className="col-span-2" />
                                    <div className="col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-[11px] font-bold text-blue-600 flex items-center gap-2">
                                            <CreditCard size={14} /> Les informations bancaires sont utilisées pour le virement de salaire.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex gap-2">
                                {(['personal', 'employment', 'contract', 'bank'] as FormTab[]).map((tab, i) => (
                                    <div key={tab} className={`h-2 w-8 rounded-full transition-all ${formTab === tab ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all text-sm">
                                    Annuler
                                </button>
                                {formTab !== 'bank' ? (
                                    <button type="button" onClick={() => {
                                        const tabs: FormTab[] = ['personal', 'employment', 'contract', 'bank'];
                                        const idx = tabs.indexOf(formTab);
                                        setFormTab(tabs[idx + 1]);
                                    }} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm">
                                        Suivant →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit as any}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm disabled:opacity-60"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Créer l'employé
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InputField({ label, value, onChange, type = 'text', required = false, className = '' }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; required?: boolean; className?: string;
}) {
    return (
        <div className={className}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options, className = '' }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; className?: string;
}) {
    return (
        <div className={className}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all text-sm font-medium text-slate-800"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}
