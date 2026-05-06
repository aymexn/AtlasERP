'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  ArrowLeft, 
  Mail, 
  Phone, 
  AlertTriangle,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { treasuryService } from '@/services/treasury';
import { formatCurrency } from '@/lib/format';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { toast } from 'sonner';

export default function CustomerAgingClient({ id }: { id: string }) {
  const t = useTranslations('treasury');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await treasuryService.getCustomerAging(id);
      setData(res);
    } catch (error) {
      toast.error('Erreur lors du chargement des données client');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      await treasuryService.sendReminder(invoiceId);
      toast.success('Rappel de paiement envoyé avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du rappel');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Chargement du détail client...</p>
      </div>
    );
  }

  const renderBucket = (title: string, invoices: any[], colorClass: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <div className={`h-2 w-2 rounded-full ${colorClass}`} />
           <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">{title}</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold">{invoices.length} Invoices</Badge>
      </div>
      
      {invoices.length === 0 ? (
        <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
           <p className="text-xs font-bold text-slate-400">Aucune facture dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileText size={20} />
                 </div>
                 <div>
                   <p className="font-black text-slate-900">{inv.reference}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Échéance: {new Date(inv.dueDate || inv.date).toLocaleDateString()}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste à payer</p>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(inv.amountRemaining)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSendReminder(inv.id)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Envoyer un rappel"
                    >
                      <Mail size={18} />
                    </button>
                    <Link 
                      href={`/invoices/${inv.id}` as any}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/treasury/aged-receivables"
            className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="space-y-1">
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{data.customer.name}</h1>
             <div className="flex items-center gap-4">
               <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-black tracking-widest">{data.customer.paymentBehavior || 'GOOD'}</Badge>
               <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1">
                 <Clock size={12} />
                 Délai moyen: {data.customer.avgPaymentDelay || 0} jours
               </span>
             </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95">
            <Phone size={20} className="text-emerald-500" />
            Appel de Recouvrement
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95">
            <AlertTriangle size={20} />
            Blocage Crédit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-slate-100 bg-white">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encours Total</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(
                    [...data.buckets.current, ...data.buckets.late30, ...data.buckets.late60, ...data.buckets.late90]
                      .reduce((sum, inv) => sum + Number(inv.amountRemaining), 0)
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-xl shadow-slate-100 bg-white">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chiffre d'Affaires</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(data.customer.totalRevenue)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100 bg-white">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plus Vieille Facture</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {Math.max(...[...data.buckets.current, ...data.buckets.late30, ...data.buckets.late60, ...data.buckets.late90].map(inv => inv.daysOverdue), 0)} jours
                </h3>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Buckets Sections */}
      <div className="grid grid-cols-1 gap-12">
        {renderBucket('Critique (90j+)', data.buckets.late90, 'bg-rose-600')}
        {renderBucket('Retard Important (60-90j)', data.buckets.late60, 'bg-orange-500')}
        {renderBucket('Retard (30-60j)', data.buckets.late30, 'bg-amber-500')}
        {renderBucket('Courant (0-30j)', data.buckets.current, 'bg-emerald-500')}
      </div>
    </div>
  );
}
