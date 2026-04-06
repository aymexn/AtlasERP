'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Plus, 
    Search, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    CreditCard, 
    FileText, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    CheckCircle2, 
    Loader2, 
    X,
    Building2,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { customersService, Customer } from '@/services/customers';
import { formatCurrency } from '@/lib/formatters';
import { useParams } from 'next/navigation';

export function CustomersClient() {
    const t = useTranslations('sales.customers');
    const ct = useTranslations('common');
    const { locale } = useParams();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '', contact: '', email: '', phone: '', address: '', taxId: '', creditLimit: 0
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await customersService.getAll();
            setCustomers(data);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCustomer) {
                await customersService.update(editingCustomer.id, formData);
                toast.success(ct('toast.updated'));
            } else {
                await customersService.create(formData);
                toast.success(ct('toast.created'));
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
            toast.success(ct('toast.deleted'));
            loadCustomers();
        } catch (err) {
            toast.error(ct('toast.error'));
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header section with Stats */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                        <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Building2 size={28} />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 font-medium ml-15">Gérez votre portefeuille clients et surveillez les limites de crédit.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingCustomer(null);
                        setFormData({ name: '', contact: '', email: '', phone: '', address: '', taxId: '', creditLimit: 0 });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-95 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t('add')}
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <User size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Clients</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">{customers.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <Shield size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Crédit Global Alloué</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">
                            {formatCurrency(customers.reduce((acc, c) => acc + Number(c.creditLimit), 0), locale as string)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-12">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact & Fiscal</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Limite Crédit</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-emerald-600 mb-4" size={40} />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{ct('loading')}</p>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="text-gray-200" size={40} />
                                        </div>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{ct('no_data')}</p>
                                    </td>
                                </tr>
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/80 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-lg border border-emerald-100 shadow-sm">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{customer.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <MapPin size={12} className="text-gray-400" />
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[200px]">{customer.address || ct('none')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Shield size={12} className="text-emerald-600" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NIF:</span>
                                                <span className="text-[10px] font-bold text-gray-700">{customer.taxId || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail size={12} className="text-blue-500" />
                                                    <span className="text-[10px] font-bold text-gray-500">{customer.email || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Phone size={12} className="text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-gray-500">{customer.phone || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-lg font-black text-gray-900 leading-none mb-1">{formatCurrency(customer.creditLimit, locale as string)}</p>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Encours Autorisé</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => {
                                                    setEditingCustomer(customer);
                                                    setFormData(customer);
                                                    setIsModalOpen(true);
                                                }}
                                                className="h-10 w-10 bg-white text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(customer.id)}
                                                className="h-10 w-10 bg-white text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
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

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                                    {editingCustomer ? t('edit') : t('add')}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Saisie des informations de la fiche client</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 bg-white text-gray-400 rounded-2xl flex items-center justify-center hover:text-rose-600 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.name')}</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input
                                            required
                                            type="text"
                                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold group-hover:border-emerald-100"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: SARL Atlas Distribution"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.contact')}</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                            value={formData.contact || ''}
                                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.taxId')}</label>
                                    <div className="relative">
                                        <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                            value={formData.taxId || ''}
                                            onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.email')}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="email"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.phone')}</label>
                                    <div className="relative">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.address')}</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                            value={formData.address || ''}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 tracking-tight px-1">{t('fields.creditLimit')}</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-black text-lg text-gray-900 shadow-sm"
                                            value={formData.creditLimit}
                                            onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-wider px-1">Le montant du crédit maximum autorisé pour ce client.</p>
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        {ct('loading')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={24} />
                                        {editingCustomer ? ct('save') : ct('save')}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

