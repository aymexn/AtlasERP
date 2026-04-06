'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Receipt, 
    Plus, 
    Search, 
    TrendingDown, 
    Calendar, 
    Tag, 
    CreditCard, 
    MoreVertical, 
    X,
    Loader2,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { expensesService } from '@/services/finances';
import { suppliersService, Supplier } from '@/services/suppliers';
import { formatCurrency } from '@/lib/formatters';
import { useParams } from 'next/navigation';

export function ExpensesClient() {
    const t = useTranslations('finances.expenses');
    const ct = useTranslations('common');
    const { locale } = useParams();
    
    const [expenses, setExpenses] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: 0,
        category: 'AUTRE',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        supplierId: '',
        notes: ''
    });

    const categories = [
        { id: 'LOYER', label: 'Loyer & Charges' },
        { id: 'SALAIRES', label: 'Salaires & Primes' },
        { id: 'MATIERES', label: 'Matières Premières' },
        { id: 'LOGISTIQUE', label: 'Transport & Logistique' },
        { id: 'MARKETING', label: 'Marketing & Com' },
        { id: 'AUTRE', label: 'Autres Dépenses' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [expensesData, suppliersData] = await Promise.all([
                expensesService.findAll(),
                suppliersService.getAll()
            ]);
            setExpenses(expensesData);
            setSuppliers(suppliersData);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await expensesService.create(newExpense);
            toast.success(ct('toast.created'));
            setIsCreateModalOpen(false);
            setNewExpense({
                title: '',
                amount: 0,
                category: 'AUTRE',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'CASH',
                supplierId: '',
                notes: ''
            });
            loadData();
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm(ct('delete_confirm'))) return;
        try {
            await expensesService.remove(id);
            toast.success(ct('toast.deleted'));
            loadData();
        } catch (err) {
            toast.error(ct('toast.error'));
        }
    };

    const filteredExpenses = expenses.filter(exp => 
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalExpensesMonth = filteredExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                        <div className="h-12 w-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <TrendingDown size={28} />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 font-medium ml-15">Contrôlez vos sorties de fonds et optimisez vos coûts.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-black hover:scale-[1.02] transition-all active:scale-95 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t('add')}
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Dépenses du Mois</p>
                        <p className="text-2xl font-black text-rose-600">{formatCurrency(totalExpensesMonth, locale as string)}</p>
                    </div>
                </div>
                {/* Add more stats here if needed */}
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6 bg-gray-50/20">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all text-sm font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.title')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.category')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.date')}</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.amount')}</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-rose-600 mb-4" size={40} />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{ct('loading')}</p>
                                    </td>
                                </tr>
                            ) : filteredExpenses.map((exp) => (
                                <tr key={exp.id} className="hover:bg-rose-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                                                <Receipt size={20} />
                                            </div>
                                            <p className="font-black text-gray-900">{exp.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-gray-300" />
                                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{exp.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                                            <Calendar size={14} />
                                            {new Date(exp.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-sm font-black text-rose-600">{formatCurrency(exp.amount, locale as string)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => handleDeleteExpense(exp.id)}
                                                className="h-10 w-10 text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl flex items-center justify-center"
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

            {/* Create Expense Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-8 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                                    <Receipt className="text-rose-600" />
                                    {t('add')}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enregistrement d'une nouvelle dépense</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="h-12 w-12 bg-white text-gray-400 rounded-2xl flex items-center justify-center hover:text-rose-600 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateExpense} className="flex-1 overflow-y-auto p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('fields.title')}</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all font-bold"
                                    value={newExpense.title}
                                    onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                                    placeholder="Ex: Loyer Avril, Achat fournitures..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('fields.amount')}</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-6 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all font-black text-rose-600"
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300">DZD</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('fields.category')}</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all font-bold appearance-none"
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('fields.date')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all font-bold"
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('fields.method')}</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all font-bold appearance-none"
                                        value={newExpense.paymentMethod}
                                        onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                                    >
                                        <option value="CASH">Espèces</option>
                                        <option value="CHECK">Chèque</option>
                                        <option value="TRANSFER">Virement</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-gray-100 hover:bg-black hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : ct('save')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
