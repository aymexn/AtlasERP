'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService, Employee } from '@/services/hr';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    UserPlus,
    UserCheck,
    Clock,
    Filter,
    Loader2,
    Building2,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    MoreVertical,
    ChevronRight,
    MapPin
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EmployeesClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');
    const tt = useTranslations('toast');

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadEmployees();
    }, []);

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

    const filteredEmployees = employees.filter(e => {
        const matchesSearch = 
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'ON_LEAVE': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'SUSPENDED': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'TERMINATED': return 'bg-rose-50 text-rose-700 border-rose-100';
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
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('employees.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <UserPlus size={20} />
                        {t('employees.add')}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Effectif', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Actifs', value: employees.filter(e => e.status === 'ACTIVE').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'En Congé', value: employees.filter(e => e.status === 'ON_LEAVE').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Départements', value: new Set(employees.map(e => e.department).filter(Boolean)).size, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('employees.search')}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-bold text-slate-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employé</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Poste & Dépt</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEmployees.map((e) => (
                                <tr key={e.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                                                {e.firstName[0]}{e.lastName[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{e.firstName} {e.lastName}</span>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{e.employeeCode || 'NO-CODE'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <Briefcase size={14} className="text-slate-300" />
                                                <span className="text-sm font-bold">{e.position || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Building2 size={12} />
                                                <span className="text-[11px] font-medium">{e.department || 'Non assigné'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {e.email && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                    <Mail size={12} className="text-slate-300" />
                                                    {e.email}
                                                </div>
                                            )}
                                            {e.phone && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                    <Phone size={12} className="text-slate-300" />
                                                    {e.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${getStatusColor(e.status)}`}>
                                            {t(`employees.status.${e.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-blue-100 shadow-sm transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all">
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
