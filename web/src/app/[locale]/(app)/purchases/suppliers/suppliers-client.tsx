'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Users, Plus, Search, Loader2, Mail, Phone, MapPin,
    Edit2, Trash2, Building2, Store, ShieldCheck,
    CreditCard, Save, X, Tag, Info, Briefcase, Printer
} from 'lucide-react';
import { downloadPdf } from '@/lib/download-pdf';
import { Supplier } from '@/services/suppliers';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

export default function SuppliersClient() {
    const t = useTranslations('purchases');
    const st = useTranslations('suppliers');
    const ct = useTranslations('common');
    const [isMounted, setIsMounted] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'commercial'>('identity');
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier> | null>(null);

    useEffect(() => {
        setIsMounted(true);
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/suppliers');
            const items = Array.isArray(data) ? data : data.data ?? [];
            setSuppliers(items);
        } catch (error: any) {
            console.error('Failed to load suppliers:', error);
            toast.error(ct('errors.fetch_failed' as any) || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setCurrentSupplier(supplier);
        setActiveTab('identity');
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentSupplier({ isActive: true, paymentTermsDays: 30, country: 'DZ' });
        setActiveTab('identity');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(ct('delete_confirm'))) return;
        try {
            await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
            toast.success(ct('save_success'));
            loadSuppliers();
        } catch (error: any) {
            toast.error(error.message || ct('toast.error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSupplier?.name) {
            toast.error(st('name_required') || "Le nom est obligatoire");
            return;
        }

        try {
            setSubmitting(true);
            const isEdit = !!currentSupplier.id;
            const endpoint = `/suppliers${isEdit ? `/${currentSupplier.id}` : ''}`;

            const payload: any = {
                name: currentSupplier.name,
                code: currentSupplier.code || undefined,
                nif: currentSupplier.nif || undefined,
                ai: currentSupplier.ai || undefined,
                rc: currentSupplier.rc || undefined,
                email: currentSupplier.email || undefined,
                phone: currentSupplier.phone || undefined,
                address: currentSupplier.address || undefined,
                city: currentSupplier.city || undefined,
                country: currentSupplier.country || 'DZ',
                paymentTermsDays: currentSupplier.paymentTermsDays ? Number(currentSupplier.paymentTermsDays) : 30,
                notes: currentSupplier.notes || undefined
            };

            // isActive is only allowed for Patch (Update), not Post (Create)
            if (isEdit) {
                payload.isActive = currentSupplier.isActive ?? true;
            }

            await apiFetch(endpoint, {
                method: isEdit ? 'PATCH' : 'POST',
                body: JSON.stringify(payload)
            });

            toast.success(ct('save_success') || "Enregistré avec succès");
            setIsModalOpen(false);
            loadSuppliers();
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(error.message || "Erreur lors de la sauvegarde");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSuppliers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return (suppliers || []).filter(s => {
            const name = s.name ? s.name.toLowerCase() : '';
            const email = s.email ? s.email.toLowerCase() : '';
            const code = s.code ? s.code.toLowerCase() : '';
            return name.includes(term) || email.includes(term) || code.includes(term);
        });
    }, [suppliers, searchTerm]);

    const stats = useMemo(() => ({
        total: suppliers.length,
        active: suppliers.filter(s => s.isActive).length,
        withOrders: suppliers.filter(s => (s as any)._count?.purchaseOrders > 0).length,
        totalPurchased: 0
    }), [suppliers]);

    if (!isMounted || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{ct('loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            <PageHeader
                title={t('suppliers.title')}
                subtitle={st('subtitle') || t('subtitle')}
                icon={Building2}
                action={{
                    label: t('new_supplier'),
                    onClick: handleAdd,
                    icon: Plus
                }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title={t('total_suppliers')} value={stats.total} icon={Users} variant="primary" type="count" loading={loading} />
                <KpiCard title={t('active_suppliers')} value={stats.active} icon={ShieldCheck} variant="success" type="count" loading={loading} />
                <KpiCard title={t('pending_orders')} value={stats.withOrders} icon={Building2} variant="warning" type="count" loading={loading} />
                <KpiCard title={ct('amount')} value={stats.totalPurchased} icon={CreditCard} variant="info" type="currency" loading={loading} />
            </div>

            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-4xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Store className="w-6 h-6 text-primary" />
                        {t('suppliers.title')}
                    </CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={ct('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold h-[52px]"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={filteredSuppliers}
                        isLoading={loading}
                        onRowClick={handleEdit}
                        columns={[
                            {
                                header: ct('code'),
                                className: 'w-[100px]',
                                accessor: (s) => (
                                    <div className="px-3 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] rounded-lg font-black tracking-tight inline-block uppercase">
                                        {s.code || '---'}
                                    </div>
                                )
                            },
                            {
                                header: ct('name'),
                                className: 'w-[250px]',
                                accessor: (s) => (
                                    <div className="flex flex-col">
                                        <span className="text-slate-900 font-black text-[15px] tracking-tight">{s.name}</span>
                                        {s.email && <span className="text-[11px] font-bold text-slate-400">{s.email}</span>}
                                    </div>
                                )
                            },
                            {
                                header: ct('city'),
                                accessor: (s) => (
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                        <MapPin size={14} className="text-slate-300" />
                                        {s.city ? `${s.city}, ${s.country}` : '---'}
                                    </div>
                                )
                            },
                            {
                                header: t('orders.title'),
                                accessor: (s: any) => (
                                    <Badge variant="confirmed">
                                        {s._count?.purchaseOrders || 0} BC
                                    </Badge>
                                )
                            },
                            {
                                header: ct('status'),
                                className: 'w-[100px]',
                                accessor: (s) => (
                                    <Badge variant={s.isActive ? 'active' : 'inactive'}>
                                        {s.isActive ? ct('active') : ct('inactive')}
                                    </Badge>
                                )
                            },
                            {
                                header: '',
                                className: 'w-[100px]',
                                align: 'right',
                                accessor: (s) => (
                                    <div className="flex items-center justify-end gap-2 pr-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); downloadPdf(`/api/pdf/supplier-card/${s.id}`, `Fiche_${s.name.replace(/\s+/g, '_')}.pdf`); }}
                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Imprimer Fiche Partenaire"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Clean Supplier Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-4xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col">
                        {/* Premium Minimalist Header */}
                        <div className="p-10 pb-4 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                                    {currentSupplier?.id ? t('suppliers.edit') : "NOUVEAU FOURNISSEUR"}
                                </h2>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {"Formulaire fiscal de création et d'identification"}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="h-10 w-10 bg-slate-100 text-slate-400 hover:text-slate-900 transition-all rounded-full flex items-center justify-center border border-slate-200 shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Minimalist Tabs */}
                        <div className="flex px-8 mt-4 gap-8 border-b border-slate-50 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'identity', label: t('suppliers.sections.identity') },
                                { id: 'contact', label: t('suppliers.sections.communication') },
                                { id: 'commercial', label: t('suppliers.sections.commercial') },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-4 border-b-2 transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-300 hover:text-slate-500'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Form Content */}
                        <form id="supplier-form" onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[55vh] flex-1">
                            {activeTab === 'identity' && (
                                <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">{t('suppliers.fields.name')}</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                                            <input
                                                required
                                                placeholder="Ex: Atlas Peintures"
                                                className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-slate-900 text-lg shadow-sm"
                                                value={currentSupplier?.name || ''}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{st('nif')}</label>
                                            <input
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-mono font-black text-slate-700 h-14"
                                                value={currentSupplier?.nif || ''}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, nif: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{st('ai') || "AI"}</label>
                                            <input
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-mono font-black text-slate-700 h-14"
                                                value={currentSupplier?.ai || ''}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, ai: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{st('rc') || "RC"}</label>
                                            <input
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-mono font-black text-slate-700 h-14"
                                                value={currentSupplier?.rc || ''}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, rc: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 leading-none">{st('code_sku')}</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                <input
                                                    placeholder="Automatique"
                                                    className="w-full pl-11 pr-5 py-4 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-mono font-black text-slate-500 h-14"
                                                    value={currentSupplier?.code || ''}
                                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, code: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="grid grid-cols-2 gap-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{st('email_label')}</label>
                                        <input
                                            type="email"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900"
                                            value={currentSupplier?.email || ''}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('suppliers.fields.phone')}</label>
                                        <input
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900"
                                            value={currentSupplier?.phone || ''}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('suppliers.fields.address')}</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 resize-none min-h-[100px]"
                                            value={currentSupplier?.address || ''}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'commercial' && (
                                <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{st('payment_terms')}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">Délai standard de règlement</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                className="w-24 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-all font-black text-center text-blue-600"
                                                value={currentSupplier?.paymentTermsDays ?? 30}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, paymentTermsDays: parseInt(e.target.value) || 30 })}
                                            />
                                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Jours</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{st('initial_status')}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">Visibilité dans le catalogue</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentSupplier({ ...currentSupplier, isActive: !currentSupplier?.isActive })}
                                            className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 ${currentSupplier?.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 transform ${currentSupplier?.isActive ? 'translate-x-7' : 'translate-x-0'} shadow-md`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Standardized Footer */}
                        <div className="p-10 pt-4 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                                >
                                    {ct('cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <span>{ct('save')}</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
