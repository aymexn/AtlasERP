'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Plus, Search, User, Users, Mail, Phone, MapPin, CheckCircle2, 
    Loader2, X, Building2, Shield, TrendingUp, Fingerprint, Info, 
    ChevronRight, Briefcase, Tag, History, CreditCard, MoreVertical, 
    FileSearch, LayoutGrid, Settings, DollarSign, Edit2, Trash2, 
    ArrowRight, Filter, FileText, Download, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { customersService, Customer } from '@/services/customers';
import { formatCurrency } from '@/lib/format';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CustomersClient() {
    const t = useTranslations('sales');
    const ct = useTranslations('common');
    const locale = useLocale();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'commercial'>('identity');
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await customersService.getAll();
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

    const filteredCustomers = useMemo(() => {
        return (customers || []).filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    const stats = useMemo(() => ({
        total: customers.length,
        totalCredit: customers.reduce((acc, c) => acc + Number(c.creditLimit || 0), 0),
        activeCount: customers.length // Simplified for now
    }), [customers]);

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
                        setEditingCustomer({ creditLimit: 0 });
                        setActiveTab('identity');
                        setIsModalOpen(true);
                    },
                    icon: Plus
                }}
            />

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title={t('customers.stats.total')}
                    value={stats.total}
                    icon={User}
                    variant="primary"
                    type="count"
                />
                <KpiCard 
                    title={t('customers.stats.active')}
                    value={stats.activeCount}
                    icon={TrendingUp}
                    variant="success"
                    type="count"
                />
                <KpiCard 
                    title={t('customers.stats.credit')}
                    value={stats.totalCredit}
                    icon={CreditCard}
                    variant="warning"
                    type="currency"
                />
            </div>

            {/* Main Area */}
            <Card className="border-none shadow-xl shadow-gray-200/40">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6 px-8">
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
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                        data={filteredCustomers}
                        isLoading={loading}
                        onRowClick={(c) => {
                            setEditingCustomer(c);
                            setIsModalOpen(true);
                        }}
                        columns={[
                            {
                                header: t('customers.fields.name'),
                                accessor: (c) => (
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-50/50 text-primary rounded-xl flex items-center justify-center font-black text-sm border border-blue-100/50 shadow-sm">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-bold">{c.name}</span>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{c.contact || t('customers.fields.no_contact')}</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: t('customers.sections.communication'),
                                accessor: (c) => (
                                    <div className="flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={12} className="text-gray-400" />
                                            <span>{c.email || t('customers.fields.none')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Fingerprint size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t('customers.fields.nif_label')}{c.taxId || t('customers.fields.none')}</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: t('customers.fields.creditLimit'),
                                align: 'right',
                                accessor: (c) => (
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-gray-900">{formatCurrency(c.creditLimit || 0)}</span>
                                        <Badge variant={Number(c.creditLimit) > 0 ? "active" : "secondary" as any}>
                                            {Number(c.creditLimit) > 0 ? t('customers.status.active') : t('customers.status.standard')}
                                        </Badge>
                                    </div>
                                )
                            },
                            {
                                header: '',
                                align: 'right',
                                accessor: (c) => (
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50/50 rounded-lg transition-all">
                                            <ChevronRight size={20} />
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.contact')}</label>
                                            <input 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                                                value={editingCustomer?.contact || ''}
                                                onChange={(e) => setEditingCustomer({...editingCustomer, contact: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('customers.fields.taxId')}</label>
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
                                                {t('customers.hints.credit')}
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
