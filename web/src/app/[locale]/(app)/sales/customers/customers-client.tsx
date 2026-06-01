'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Plus, Search, Users, TrendingUp, Clock, AlertCircle, 
    X, Building2, Fingerprint, Info, Briefcase, BarChart2,
    Edit2, Trash2, Printer, Filter, Loader2, Ban, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { customersService, Customer, CustomerType } from '@/services/customers';
import { formatCurrency } from '@/lib/format';
import { useRouter } from '@/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { downloadPdf } from '@/lib/download-pdf';
import { CustomerKPICards } from '@/components/customers/CustomerKPICards';

export default function CustomersClient() {
    const t = useTranslations('sales');
    const ct = useTranslations('common');
    const router = useRouter();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters
    const [filters, setFilters] = useState({
        segment: '' as any,
        riskLevel: '' as any
    });

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'commercial'>('identity');
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        loadCustomers();
    }, [filters]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            const data = await customersService.getAll(activeFilters);
            setCustomers(data || []);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer?.name) return;
        
        setIsSubmitting(true);
        try {
            if (editingCustomer.id) {
                await customersService.update(editingCustomer.id, editingCustomer);
                toast.success(ct('save_success'));
            } else {
                await customersService.create(editingCustomer as any);
                toast.success(ct('save_success'));
            }
            setIsModalOpen(false);
            loadCustomers();
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(ct('delete_confirm'))) return;
        try {
            await customersService.delete(id);
            toast.success(ct('save_success'));
            loadCustomers();
        } catch (err) {
            toast.error(ct('toast.error'));
        }
    };

    const handleToggleBlock = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        if (!confirm(currentStatus ? 'Débloquer ce client ?' : 'Bloquer ce client ?')) return;
        try {
            await customersService.toggleBlock(id);
            toast.success('Statut du client mis à jour');
            loadCustomers();
        } catch (err) {
            toast.error(ct('toast.error'));
        }
    };

    const filteredCustomers = useMemo(() => {
        return (customers || []).filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    const stats = useMemo(() => {
        const total = customers.length;
        let totalRevenue = 0;
        let totalEncours = 0;
        let totalDso = 0;

        customers.forEach(c => {
            totalRevenue += (c.caTotal || 0);
            totalEncours += (c.encours || 0);
            totalDso += (c.dso || 0);
        });

        return {
            total,
            totalRevenue,
            totalEncours,
            avgDso: total > 0 ? Math.round(totalDso / total) : 0
        };
    }, [customers]);

    const getSegmentBadge = (segment?: string) => {
        switch (segment) {
            case 'A': return <Badge variant="active" className="bg-amber-100 text-amber-700 border-amber-200">GOLD A</Badge>;
            case 'B': return <Badge variant="active" className="bg-slate-100 text-slate-700 border-slate-200">SILVER B</Badge>;
            case 'C': return <Badge variant="default">STANDARD C</Badge>;
            default: return <Badge variant="default">---</Badge>;
        }
    };

    const getRiskBadge = (risk?: string) => {
        switch (risk) {
            case 'HIGH': return <Badge variant="danger" className="bg-red-500 text-white border-red-600">HIGH RISK</Badge>;
            case 'MEDIUM': return <Badge variant="warning" className="bg-amber-500 text-white border-amber-600">MEDIUM RISK</Badge>;
            case 'LOW': return <Badge variant="active" className="bg-emerald-500 text-white border-emerald-600">LOW RISK</Badge>;
            default: return <Badge variant="default">UNKNOWN</Badge>;
        }
    };

    if (!isMounted || (loading && customers.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10 animate-in fade-in duration-700">
            <PageHeader 
                title={t('customers.title')}
                subtitle={t('customers.subtitle')}
                icon={Users}
                action={{
                    label: t('customers.add'),
                    onClick: () => {
                        setEditingCustomer({ creditLimit: 0, customerType: 'RETAILER' });
                        setActiveTab('identity');
                        setIsModalOpen(true);
                    },
                    icon: Plus
                }}
            />

            {/* KPI Section */}
            <CustomerKPICards 
                totalCustomers={stats.total}
                totalRevenue={stats.totalRevenue}
                totalEncours={stats.totalEncours}
                avgDso={stats.avgDso}
            />

            {/* Main Area */}
            <Card className="border-none shadow-xl shadow-gray-200/40">
                <CardHeader className="flex flex-col gap-6 border-b border-gray-50 pb-6 px-8">
                    <div className="flex flex-row items-center justify-between w-full">
                        <CardTitle className="text-xl font-black text-gray-800 flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-primary" />
                            {t('customers.title')}
                        </CardTitle>
                        <div className="relative group w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder={ct('search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                            />
                        </div>
                    </div>
                    
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                            <Filter size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filters:</span>
                        </div>
                        <select 
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-primary transition-all"
                            value={filters.segment}
                            onChange={(e) => setFilters({...filters, segment: e.target.value})}
                        >
                            <option value="">Tous les Segments</option>
                            <option value="A">Segment A (Gold)</option>
                            <option value="B">Segment B (Silver)</option>
                            <option value="C">Segment C (Standard)</option>
                        </select>
                        <select 
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-primary transition-all"
                            value={filters.riskLevel}
                            onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
                        >
                            <option value="">Tous les Risques</option>
                            <option value="LOW">Low Risk</option>
                            <option value="MEDIUM">Medium Risk</option>
                            <option value="HIGH">High Risk</option>
                        </select>
                        <button 
                            onClick={() => setFilters({segment: '', riskLevel: ''})}
                            className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                        data={filteredCustomers}
                        isLoading={loading}
                        onRowClick={(c) => router.push({ pathname: '/sales/customers/[id]', params: { id: c.id } })}
                        columns={[
                            {
                                header: t('customers.fields.name'),
                                accessor: (c) => (
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-50/50 text-primary rounded-xl flex items-center justify-center font-black text-sm border border-blue-100/50 shadow-sm relative">
                                            {c.name.charAt(0)}
                                            {c.isBlocked && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                                                    <Ban size={10} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-gray-900 font-bold ${c.isBlocked ? 'line-through text-slate-400' : ''}`}>{c.name}</span>
                                                {getSegmentBadge(c.segment)}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{c.customerType || 'RETAILER'} • {c.email || t('customers.fields.no_contact')}</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Finances',
                                accessor: (c) => (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-16">CA</span>
                                            <span className="text-xs font-black text-slate-700">{formatCurrency(c.caTotal || 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-16">Encours</span>
                                            <span className={`text-xs font-black ${Number(c.encours) > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                                                {formatCurrency(c.encours || 0)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Risque',
                                accessor: (c) => (
                                    <div className="flex flex-col gap-1.5 items-start">
                                        {getRiskBadge(c.riskLevel)}
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                                            <Clock size={10} />
                                            DSO: {c.dso || 0}j
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: '',
                                align: 'right',
                                accessor: (c) => (
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={(e) => handleToggleBlock(e, c.id, c.isBlocked)}
                                            className={`p-2 rounded-lg transition-all ${c.isBlocked ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                            title={c.isBlocked ? 'Débloquer' : 'Bloquer'}
                                        >
                                            {c.isBlocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); setIsModalOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Edit Profile"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); downloadPdf(`/api/pdf/customer-statement/${c.id}`, `Releve_${c.name.replace(/\s+/g, '_')}.pdf`); }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Imprimer Relevé"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Elite Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-4xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all border border-slate-100">
                        {/* Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {editingCustomer?.id ? t('customers.edit') : t('customers.add')}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                    {editingCustomer?.name || t('customers.form.subtitle')}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-8 mt-4 gap-6 border-b border-slate-50 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'identity', label: t('customers.sections.identity'), icon: Fingerprint },
                                { id: 'contact', label: t('customers.sections.communication'), icon: Info },
                                { id: 'commercial', label: t('customers.sections.commercial'), icon: Briefcase },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 border-b-2 transition-all font-bold text-sm whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                            {activeTab === 'identity' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.name')}</label>
                                            <input 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={editingCustomer?.name || ''}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type de Client</label>
                                            <select 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={editingCustomer?.customerType || 'RETAILER'}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, customerType: e.target.value as CustomerType})}
                                            >
                                                <option value="PROMOTER">Promoter</option>
                                                <option value="WHOLESALER">Wholesaler</option>
                                                <option value="RETAILER">Retailer</option>
                                                <option value="GOVERNMENT">Government</option>
                                                <option value="INDIVIDUAL">Individual</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.taxId')} (NIF)</label>
                                            <input 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-mono font-black text-slate-700"
                                                value={editingCustomer?.taxId || ''}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, taxId: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.email')}</label>
                                            <input 
                                                type="email"
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={editingCustomer?.email || ''}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.phone')}</label>
                                            <input 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={editingCustomer?.phone || ''}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.address')}</label>
                                            <textarea 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900 min-h-[100px]"
                                                value={editingCustomer?.address || ''}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'commercial' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 shadow-inner space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-blue-800 tracking-widest ml-1 uppercase">{t('customers.fields.creditLimit')} (DA)</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                className="w-full px-6 py-4 bg-white border-2 border-blue-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-black text-2xl text-blue-900 shadow-sm"
                                                value={editingCustomer?.creditLimit || 0}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, creditLimit: Number(e.target.value)})}
                                            />
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Info size={16} className="text-blue-600 mt-0.5" />
                                            <p className="text-[10px] font-bold text-blue-700/70 leading-relaxed uppercase">
                                                L'encours autorisé définit la limite de crédit pour ce client. Si l'encours dépasse cette limite, les commandes peuvent être bloquées.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                {ct('cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingCustomer?.id ? <><Edit2 size={18} /> {ct('save')}</> : <><Plus size={18} /> {ct('save')}</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
