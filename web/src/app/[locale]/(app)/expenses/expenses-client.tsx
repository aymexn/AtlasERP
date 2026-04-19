'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Receipt, Plus, Search, TrendingDown, Calendar, Tag, CreditCard, X,
    Loader2, Trash2, AlertTriangle, FileText, Download, Save, Wallet,
    Coins, Settings, Briefcase, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { expensesService } from '@/services/finances';
import { suppliersService, Supplier } from '@/services/suppliers';
import { formatCurrency } from '@/lib/format';
import { useParams } from 'next/navigation';
import { downloadPdf } from '@/lib/download-pdf';
import { API_URL } from '@/lib/api';

import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ExpensesClient() {
    const t = useTranslations('finances.expenses');
    const pt = useTranslations('finances.payments');
    const ct = useTranslations('common');
    const { locale } = useParams();
    
    const [expenses, setExpenses] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: 0,
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        supplierId: '',
        reference: '',
        notes: ''
    });

    const categories = [
        { id: 'rent', label: t('categories.rent') },
        { id: 'salaries', label: t('categories.salaries') },
        { id: 'materials', label: t('categories.materials') },
        { id: 'logistics', label: t('categories.logistics') },
        { id: 'marketing', label: t('categories.marketing') },
        { id: 'utilities', label: t('categories.utilities') },
        { id: 'consulting', label: t('categories.consulting') },
        { id: 'other', label: t('categories.other') }
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
        
        if (!newExpense.title || newExpense.amount <= 0) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        setIsSubmitting(true);
        try {
            await expensesService.create(newExpense);
            toast.success(ct('toast.created'));
            setIsModalOpen(false);
            setNewExpense({
                title: '',
                amount: 0,
                category: 'other',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'CASH',
                supplierId: '',
                reference: '',
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

    const filteredExpenses = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return expenses.filter(exp => 
            (exp.title?.toLowerCase() || '').includes(term) ||
            (exp.category?.toLowerCase() || '').includes(term)
        );
    }, [expenses, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: filteredExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0)
        };
    }, [filteredExpenses]);

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            <PageHeader 
                title={t('title')}
                subtitle={t('subtitle')}
                icon={TrendingDown}
                action={{
                    label: t('add'),
                    onClick: () => {
                        setNewExpense({
                            title: '',
                            amount: 0,
                            category: 'other',
                            date: new Date().toISOString().split('T')[0],
                            paymentMethod: 'CASH',
                            supplierId: '',
                            reference: '',
                            notes: ''
                        });
                        setActiveTab('basic');
                        setIsModalOpen(true);
                    },
                    icon: Plus
                }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <KpiCard 
                    title={t('stats.total')}
                    value={stats.total}
                    icon={TrendingDown}
                    variant="danger"
                    type="currency"
                />
            </div>

            {/* Main Table */}
            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-4xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Coins className="w-6 h-6 text-primary" />
                        {t('list_title')}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                toast.promise(
                                    downloadPdf(`${API_URL}/expenses/export/pdf`, 'depenses-recap.pdf'),
                                    {
                                        loading: 'Génération de l\'export...',
                                        success: 'Export terminé',
                                        error: 'Erreur lors de l\'export'
                                    }
                                );
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <Download size={14} />
                            {ct('export_pdf')}
                        </button>
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder={ct('search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold h-[48px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                        data={filteredExpenses}
                        isLoading={loading}
                        columns={[
                            {
                                header: "DÉSIGNATION",
                                className: "w-[350px]",
                                accessor: (exp: any) => (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                                            <Receipt size={18} />
                                        </div>
                                        <div className="font-black text-slate-900 text-[15px] tracking-tight truncate max-w-[300px]">
                                            {exp.title}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: "CATÉGORIE",
                                accessor: (exp: any) => (
                                    <Badge variant="primary" className="bg-slate-100 text-slate-600 border-none">
                                        {t(`categories.${exp.category.toLowerCase()}` as any)}
                                    </Badge>
                                )
                            },
                            {
                                header: "DATE",
                                accessor: (exp: any) => <span className="text-sm font-bold text-slate-500">{new Date(exp.date).toLocaleDateString(locale as string)}</span>
                            },
                            {
                                header: "MONTANT",
                                align: 'right' as const,
                                className: "text-right min-w-[140px] whitespace-nowrap",
                                accessor: (exp: any) => <span className="text-sm font-black text-danger">{formatCurrency(exp.amount)}</span>
                            },
                            {
                                header: '',
                                align: 'right' as const,
                                className: "pr-8",
                                accessor: (exp: any) => (
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleDeleteExpense(exp.id)}
                                            className="p-2.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded-xl transition-all"
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

            {/* Elite Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-4xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        {/* Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {t('sheet_title')}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                    {t('sheet_description')}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-8 mt-4 gap-6 border-b border-slate-50 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'basic', label: "Informations", icon: FileText },
                                { id: 'advanced', label: "Détails", icon: Settings },
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

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            {activeTab === 'basic' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Wallet size={48} />
                                        </div>
                                        <div className="relative z-10 space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Flux ce mois</span>
                                            <div className="text-2xl font-black tracking-tight">
                                                {formatCurrency(stats.total)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('fields.title')} *</label>
                                        <input
                                            type="text"
                                            placeholder={t('fields.title_placeholder')}
                                            className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800"
                                            value={newExpense.title}
                                            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Montant (DA) *</label>
                                            <input
                                                type="number"
                                                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-danger focus:bg-white transition-all font-black text-danger text-lg"
                                                value={newExpense.amount}
                                                onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                                            <input
                                                type="date"
                                                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800"
                                                value={newExpense.date}
                                                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Catégorie</label>
                                            <select
                                                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800"
                                                value={newExpense.category}
                                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mode de Paiement</label>
                                            <select
                                                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800"
                                                value={newExpense.paymentMethod}
                                                onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                                            >
                                                <option value="CASH">Espèces</option>
                                                <option value="CHECK">Chèque</option>
                                                <option value="TRANSFER">Virement</option>
                                                <option value="OTHER">Autre</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fournisseur lié</label>
                                        <select
                                            className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800"
                                            value={newExpense.supplierId}
                                            onChange={(e) => setNewExpense({ ...newExpense, supplierId: e.target.value })}
                                        >
                                            <option value="">Aucun</option>
                                            {suppliers.map(sup => (
                                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes internes</label>
                                        <textarea
                                            rows={3}
                                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800 text-sm resize-none"
                                            value={newExpense.notes}
                                            placeholder="Détails additionnels..."
                                            onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shadow-inner">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all font-bold"
                            >
                                {ct('cancel')}
                            </button>
                            <button
                                onClick={handleCreateExpense}
                                disabled={isSubmitting}
                                className="px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {ct('save')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
