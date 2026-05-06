'use client';

import { useState, useEffect, useMemo } from 'react';
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
    Eye,
    TrendingUp,
    Loader2,
    Save,
    X,
    Calendar,
    Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { invoicesService } from '@/services/invoices';
import { paymentsService } from '@/services/finances';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter } from 'next/navigation';
import { downloadPdf } from '@/lib/download-pdf';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

export function InvoicesClient() {
    const t = useTranslations('finances.invoices');
    const pt = useTranslations('finances.payments');
    const ct = useTranslations('common');
    const { locale } = useParams();
    const router = useRouter();
    
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'CASH',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
    });

    useEffect(() => {
        setIsMounted(true);
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

    const handleOpenSheet = (invoice: any) => {
        setSelectedInvoice(invoice);
        setPaymentData({
            amount: Number(invoice.totalAmountTtc) - Number(invoice.amountPaid),
            method: 'CASH',
            date: new Date().toISOString().split('T')[0],
            reference: '',
            notes: ''
        });
        setIsSheetOpen(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        
        if (paymentData.amount <= 0) {
            toast.error('Le montant doit être supérieur à zéro');
            return;
        }

        setIsSubmitting(true);
        try {
            await paymentsService.recordPayment({
                invoiceId: selectedInvoice.id,
                ...paymentData
            });
            toast.success(ct('save_success'));
            setIsSheetOpen(false);
            loadInvoices();
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || ct('toast.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredInvoices = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return invoices.filter(inv => 
            (inv.reference?.toLowerCase() || '').includes(term) ||
            (inv.customer?.name?.toLowerCase() || '').includes(term)
        );
    }, [invoices, searchTerm]);

    const stats = useMemo(() => {
        const total = invoices.reduce((acc, inv) => acc + Number(inv.totalAmountTtc), 0);
        const paid = invoices.reduce((acc, inv) => acc + Number(inv.amountPaid), 0);
        return { total, paid, pending: total - paid };
    }, [invoices]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PAID': return 'success';
            case 'PARTIAL': return 'warning';
            case 'CANCELLED': return 'danger';
            case 'SENT': return 'info';
            default: return 'slate';
        }
    };

    if (!isMounted || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <PermissionGuard module="finance" resource="transaction" action="read" showLoading>
            <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
                <PageHeader 
                    title={t('title')}
                    subtitle={t('subtitle')}
                    icon={Receipt}
                />

                {/* Financial KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard 
                        title={t('kpi.total_invoiced')}
                        value={stats.total}
                    icon={TrendingUp}
                    variant="primary"
                    type="currency"
                    loading={loading}
                />
                <KpiCard 
                    title={t('kpi.total_paid')}
                    value={stats.paid}
                    icon={CheckCircle2}
                    variant="success"
                    type="currency"
                    subtitle={`${((stats.paid / (stats.total || 1)) * 100).toFixed(1)}% recovery`}
                    loading={loading}
                />
                <KpiCard 
                    title={t('kpi.total_pending')}
                    value={stats.pending}
                    icon={Clock}
                    variant="warning"
                    type="currency"
                    loading={loading}
                />
            </div>

            {/* Main Table */}
            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-4xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary" />
                        {t('list_title')}
                    </CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder={ct('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-bold h-[52px]"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                        data={filteredInvoices}
                        isLoading={loading}
                        columns={[
                            {
                                header: ct('reference'),
                                className: "w-[180px]",
                                accessor: (inv: any) => (
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] rounded-lg font-black tracking-tight inline-block uppercase">
                                            {inv.reference}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: ct('fields.customer'),
                                className: "w-[300px]",
                                accessor: (inv: any) => (
                                    <div className="font-black text-slate-900 text-[15px] tracking-tight truncate max-w-[280px]">
                                        {inv.customer?.name}
                                    </div>
                                )
                            },
                            {
                                header: ct('date'),
                                accessor: (inv: any) => <span className="text-sm font-bold text-slate-500">{new Date(inv.date).toLocaleDateString(locale as string)}</span>
                            },
                            {
                                header: t('total_ttc'),
                                align: 'right' as const,
                                className: "min-w-[140px] whitespace-nowrap",
                                accessor: (inv: any) => <span className="text-sm font-black text-slate-900">{formatCurrency(inv.totalAmountTtc)}</span>
                            },
                            {
                                header: ct('status'),
                                align: 'center' as const,
                                accessor: (inv: any) => (
                                    <Badge variant={getStatusVariant(inv.status) as any}>
                                        {t(`status.${inv.status.toLowerCase()}`)}
                                    </Badge>
                                )
                            },
                            {
                                header: '',
                                align: 'right' as const,
                                className: "pr-8",
                                accessor: (inv: any) => (
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toast.promise(
                                                    downloadPdf(invoicesService.getInvoicePdfUrl(inv.id), `facture-${inv.reference}.pdf`),
                                                    {
                                                        loading: 'Génération du PDF...',
                                                        success: 'Facture téléchargée',
                                                        error: 'Erreur lors de la génération'
                                                    }
                                                );
                                            }}
                                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Download size={18} />
                                        </button>
                                        {inv.status !== 'PAID' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenSheet(inv);
                                                }}
                                                className="p-2.5 text-slate-400 hover:text-success hover:bg-green-50 rounded-xl transition-all"
                                            >
                                                <CreditCard size={18} />
                                            </button>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Elite Payment Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-[500px]">
                    <SheetHeader>
                        <SheetTitle>{t('sheet_title')}</SheetTitle>
                        <SheetDescription>
                            {t('sheet_description', { reference: selectedInvoice?.reference, remaining: selectedInvoice && formatCurrency(Number(selectedInvoice.totalAmountTtc) - Number(selectedInvoice.amountPaid)) })}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
                        <div className="bg-slate-900 rounded-4xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Wallet size={64} />
                            </div>
                            <div className="relative z-10 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('total_ttc')}</span>
                                <div className="text-3xl font-black tracking-tight">
                                    {selectedInvoice && formatCurrency(selectedInvoice.totalAmountTtc)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('amount_to_pay')}</label>
                                <input 
                                    type="number"
                                    className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-success focus:bg-white transition-all font-black text-slate-900 text-xl"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Méthode</label>
                                    <select 
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-bold text-slate-800"
                                        value={paymentData.method}
                                        onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                                    >
                                        <option value="CASH">{pt('methods.cash')}</option>
                                        <option value="CHECK">{pt('methods.check')}</option>
                                        <option value="TRANSFER">{pt('methods.transfer')}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-bold text-slate-800"
                                        value={paymentData.date}
                                        onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Référence / Nº Chèque</label>
                                <input 
                                    type="text"
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-bold text-slate-800"
                                    value={paymentData.reference}
                                    placeholder="Optionnel..."
                                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes internes</label>
                                <textarea 
                                    rows={3}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary transition-all font-bold text-slate-800 text-sm resize-none"
                                    value={paymentData.notes}
                                    placeholder="Détails additionnels..."
                                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <button 
                            type="button" 
                            onClick={() => setIsSheetOpen(false)}
                            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                        >
                            {ct('cancel')}
                        </button>
                        <button
                            onClick={handleRecordPayment}
                            disabled={isSubmitting}
                            className="px-12 py-4 bg-success text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save size={18} /> {pt('validate')}</>}
                        </button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    </PermissionGuard>
    );
}
