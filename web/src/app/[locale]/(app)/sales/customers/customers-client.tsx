'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Plus, Search, User, Users, Mail, Phone, MapPin, CheckCircle2, 
    Loader2, X, Building2, Shield, TrendingUp, Fingerprint, Info, 
    ChevronRight, Briefcase, Tag, History, CreditCard, MoreVertical, 
    FileSearch, LayoutGrid, Settings, DollarSign, Edit2, Trash2, 
    ArrowRight, Filter, FileText, Download, UserPlus, Printer, BarChart2,
    Clock
} from 'lucide-react';
import { downloadPdf } from '@/lib/download-pdf';
import { toast } from 'sonner';
import { customersService, Customer, CustomerSegment, CustomerType, PaymentBehavior, RiskLevel } from '@/services/customers';
import { formatCurrency } from '@/lib/format';
import { useRouter } from '@/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
        customerType: '' as any,
        paymentBehavior: '' as any,
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

    const filteredCustomers = useMemo(() => {
        return (customers || []).filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    const stats = useMemo(() => ({
        total: customers.length,
        totalRevenue: customers.reduce((acc, c) => acc + Number(c.totalRevenue || 0), 0),
        avgDelay: customers.length > 0 
            ? Math.round(customers.reduce((acc, c) => acc + (c.avgPaymentDelay || 0), 0) / customers.length) 
            : 0
    }), [customers]);

    const getSegmentBadge = (segment?: string) => {
        switch (segment) {
            case 'A': return <Badge variant="active" className="bg-amber-100 text-amber-700 border-amber-200">GOLD A</Badge>;
            case 'B': return <Badge variant="active" className="bg-slate-100 text-slate-700 border-slate-200">SILVER B</Badge>;
            case 'C': return <Badge variant="default">STANDARD C</Badge>;
            default: return <Badge variant="default">---</Badge>;
        }
    };

    const getRiskColor = (risk?: string) => {
        switch (risk) {
            case 'HIGH': return 'text-red-600 bg-red-50';
            case 'MEDIUM': return 'text-amber-600 bg-amber-50';
            case 'LOW': return 'text-green-600 bg-green-50';
            default: return 'text-slate-400 bg-slate-50';
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title={t('customers.stats.total')}
                    value={stats.total}
                    icon={User}
                    variant="primary"
                    type="count"
                />
                <KpiCard 
                    title={t('customers.stats.revenue')}
                    value={stats.totalRevenue}
                    icon={TrendingUp}
                    variant="success"
                    type="currency"
                />
                <KpiCard 
                    title={t('customers.stats.delay')}
                    value={stats.avgDelay}
                    icon={Clock}
                    variant="warning"
                    type="count"
                    subtitle="jours en moyenne"
                />
            </div>

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
                            <option value="">All Segments</option>
                            <option value="A">Segment A (Gold)</option>
                            <option value="B">Segment B (Silver)</option>
                            <option value="C">Segment C (Standard)</option>
                        </select>
                        <select 
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-primary transition-all"
                            value={filters.customerType}
                            onChange={(e) => setFilters({...filters, customerType: e.target.value})}
                        >
                            <option value="">All Types</option>
                            <option value="PROMOTER">Promoter</option>
                            <option value="WHOLESALER">Wholesaler</option>
                            <option value="RETAILER">Retailer</option>
                            <option value="GOVERNMENT">Government</option>
                            <option value="INDIVIDUAL">Individual</option>
                        </select>
                        <select 
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-primary transition-all"
                            value={filters.paymentBehavior}
                            onChange={(e) => setFilters({...filters, paymentBehavior: e.target.value})}
                        >
                            <option value="">All Behaviors</option>
                            <option value="EXCELLENT">Excellent</option>
                            <option value="GOOD">Good</option>
                            <option value="AVERAGE">Average</option>
                            <option value="POOR">Poor</option>
                        </select>
                        <button 
                            onClick={() => setFilters({segment: '', customerType: '', paymentBehavior: '', riskLevel: ''})}
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
                                        <div className="h-10 w-10 bg-blue-50/50 text-primary rounded-xl flex items-center justify-center font-black text-sm border border-blue-100/50 shadow-sm">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-900 font-bold">{c.name}</span>
                                                {getSegmentBadge(c.segment)}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{c.customerType || 'RETAILER'} • {c.contact || t('customers.fields.no_contact')}</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Performance',
                                accessor: (c) => (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-700">{formatCurrency(c.totalRevenue || 0)}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('customers.fields.revenue')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${getRiskColor(c.riskLevel)}`}>
                                                {c.riskLevel || 'LOW'} RISK
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.avgPaymentDelay || 0}d {t('customers.fields.delay').split(' ')[0]}</span>
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
                                        <Badge variant={Number(c.creditLimit) > 0 ? "active" : "default"}>
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
                                            onClick={(e) => { e.stopPropagation(); router.push({ pathname: '/sales/customers/[id]', params: { id: c.id } }); }}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Dashboard"
                                        >
                                            <BarChart2 size={16} />
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Customer Type</label>
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

