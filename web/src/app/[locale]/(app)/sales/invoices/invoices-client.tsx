'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Receipt, 
    Search, 
    FileText, 
    Download, 
    CreditCard, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    MoreVertical,
    Eye,
    Filter,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { invoicesService } from '@/services/invoices';
import { paymentsService } from '@/services/finances';
import { formatCurrency } from '@/lib/formatters';
import { useParams } from 'next/navigation';
import { X } from 'lucide-react';

export function InvoicesClient() {
    const t = useTranslations('finances.invoices');
    const pt = useTranslations('finances.payments');
    const ct = useTranslations('common');
    const { locale } = useParams();
    
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'CASH',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
    });

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const data = await invoicesService.findAll();
            setInvoices(data);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        setPaymentData({
            ...paymentData,
            amount: Number(invoice.totalTtc) - Number(invoice.amountPaid)
        });
        setIsPaymentModalOpen(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        setIsSubmitting(true);
        try {
            await paymentsService.recordPayment({
                invoiceId: selectedInvoice.id,
                ...paymentData
            });
            toast.success('Paiement enregistré avec succès.');
            setIsPaymentModalOpen(false);
            loadInvoices();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'UNPAID': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'PARTIAL': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'CANCELLED': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircle2 size={14} />;
            case 'UNPAID': return <AlertCircle size={14} />;
            case 'PARTIAL': return <Clock size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.totalTtc), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.amountPaid), 0);
    const totalPending = totalInvoiced - totalPaid;

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Receipt size={28} />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 font-medium ml-15">Suivi de la facturation client et des encaissements.</p>
                </div>
            </header>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Total Facturé</p>
                    <p className="text-3xl font-black text-gray-900">{formatCurrency(totalInvoiced, locale as string)}</p>
                    <div className="mt-4 flex items-center gap-2 text-blue-600">
                        <TrendingUp size={16} />
                        <span className="text-xs font-bold">Volume Global</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Total Encaissé</p>
                    <p className="text-3xl font-black text-emerald-600">{formatCurrency(totalPaid, locale as string)}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold">{((totalPaid / (totalInvoiced || 1)) * 100).toFixed(1)}% Recouvré</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Reste à Recouvrer</p>
                    <p className="text-3xl font-black text-rose-600">{formatCurrency(totalPending, locale as string)}</p>
                    <div className="mt-4 flex items-center gap-2 text-rose-600">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold">Créances Clients</span>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6 bg-gray-50/20">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                            <Filter size={18} />
                            Filtres
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('reference')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('date')}</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant TTC</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{ct('loading')}</p>
                                    </td>
                                </tr>
                            ) : filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                                <FileText size={20} />
                                            </div>
                                            <p className="font-black text-gray-900">{inv.reference}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-gray-900">{inv.customer?.name}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[11px] font-bold text-gray-500">{new Date(inv.date).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-sm font-black text-gray-900">{formatCurrency(inv.totalTtc, locale as string)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyle(inv.status)}`}>
                                                {getStatusIcon(inv.status)}
                                                {t(`status.${inv.status.toLowerCase()}`)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end gap-2">
                                            <a 
                                                href={invoicesService.getInvoicePdfUrl(inv.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 w-10 bg-white text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                                title="Télécharger PDF"
                                            >
                                                <Download size={18} />
                                            </a>
                                            {inv.status !== 'PAID' && (
                                                <button 
                                                    onClick={() => handleOpenPaymentModal(inv)}
                                                    className="h-10 w-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                    title="Saisir Paiement"
                                                >
                                                    <CreditCard size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Payment Modal */}
            {isPaymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                                    <CreditCard className="text-emerald-600" />
                                    {pt('add')}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Encaissement pour {selectedInvoice.reference}</p>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="h-12 w-12 bg-white text-gray-400 rounded-2xl flex items-center justify-center hover:text-rose-600 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="p-10 space-y-6">
                            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 mb-4">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Reste à payer</p>
                                <p className="text-3xl font-black text-emerald-900">
                                    {formatCurrency(Number(selectedInvoice.totalTtc) - Number(selectedInvoice.amountPaid), locale as string)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{pt('fields.amount')}</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-black text-emerald-600"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{pt('fields.method')}</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold appearance-none"
                                        value={paymentData.method}
                                        onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                                    >
                                        <option value="CASH">Espèces</option>
                                        <option value="CHECK">Chèque</option>
                                        <option value="TRANSFER">Virement</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{pt('fields.date')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                        value={paymentData.date}
                                        onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{pt('fields.reference')}</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                                        value={paymentData.reference}
                                        onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                        placeholder="Ex: N° Chèque..."
                                    />
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50"
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
