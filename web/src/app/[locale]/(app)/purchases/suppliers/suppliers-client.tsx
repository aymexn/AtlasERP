'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    Truck, Plus, Search, Filter, Loader2, Edit2, 
    Trash2, CheckCircle2, X, MapPin, Phone, Mail, 
    Building2, Hash, Calendar, MoreVertical, CreditCard
} from 'lucide-react';
import { suppliersService, Supplier, SupplierStats } from '@/services/suppliers';
import { toast } from 'sonner';

export default function SuppliersClient() {
    const t = useTranslations('purchases');
    const ct = useTranslations('common');
    const locale = useLocale();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [stats, setStats] = useState<SupplierStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(true);
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, s] = await Promise.all([
                suppliersService.getAll(),
                suppliersService.getStats()
            ]);
            setSuppliers(data);
            setStats(s);
        } catch (error) {
            console.error(error);
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (isCreateMode) {
                await suppliersService.create(currentSupplier);
                toast.success(ct('toast.success'));
            } else {
                await suppliersService.update(currentSupplier.id!, currentSupplier);
                toast.success(ct('toast.success'));
            }
            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(ct('confirm_delete'))) return;
        try {
            await suppliersService.delete(id);
            toast.success(ct('toast.success'));
            await loadData();
        } catch (err: any) {
            toast.error(err.message || t('errors.supplier_has_orders'));
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && suppliers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('suppliers')}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{t('subtitle')}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setCurrentSupplier({ country: 'DZ', paymentTermsDays: 30 });
                        setIsCreateMode(true);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-gray-200 transition-all active:scale-95 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t('new_supplier')}
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: t('suppliers'), value: stats?.totalSuppliers || 0, sub: t('total_suppliers'), color: 'blue', icon: Building2 },
                    { label: t('status.active'), value: stats?.activeSuppliers || 0, sub: 'Active Accounts', color: 'emerald', icon: CheckCircle2 },
                    { label: t('orders'), value: stats?.suppliersWithOrders.reduce((acc, s) => acc + s._count.purchaseOrders, 0) || 0, sub: 'Total POs', color: 'indigo', icon: Hash }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                            </div>
                            <div className={`h-12 w-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-lg group-hover:shadow-${stat.color}-100 shadow-sm border border-${stat.color}-100/50`}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden shadow-gray-200/50">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between gap-6 bg-gray-50/20">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={ct('search')}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Info</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Contact</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Location</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Terms</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredSuppliers.map((s) => (
                                <tr key={s.id} className="hover:bg-blue-50/30 transition-all group border-l-4 border-l-transparent hover:border-l-blue-600">
                                    <td className="px-8 py-6">
                                        <div className="font-black text-gray-900 text-base">{s.name}</div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 w-fit">{s.code || 'NO-CODE'}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail size={14} className="text-gray-300" />
                                                <span className="font-medium text-xs font-mono">{s.email || '---'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone size={14} className="text-gray-300" />
                                                <span className="font-medium text-xs">{s.phone || '---'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-900 font-bold">
                                            <MapPin size={14} className="text-blue-500" />
                                            <span>{s.city || '---'}, {s.country}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium truncate max-w-[200px] mt-1">{s.address}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-indigo-400" />
                                            <span className="font-black text-gray-900">{s.paymentTermsDays} {t('days')}</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Net {s.paymentTermsDays}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {s.isActive ? t('status.active') : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => {
                                                    setCurrentSupplier(s);
                                                    setIsCreateMode(false);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(s.id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-50 shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                                    <Truck size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {isCreateMode ? t('new_supplier') : t('edit_supplier')}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-all p-2 bg-gray-50 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('name')}</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.name || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('code')}</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.code || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('tax_id')} (NIF/AI)</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.taxId || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, taxId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('email')}</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.email || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('phone')}</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.phone || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('city')}</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.city || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('payment_terms_days')}</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.paymentTermsDays || 30}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, paymentTermsDays: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('address')}</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                                        value={currentSupplier.address || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all">
                                    {ct('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-xs shadow-xl shadow-gray-200"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    {isCreateMode ? ct('create') : ct('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
