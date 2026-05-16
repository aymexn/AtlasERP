'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Phone, 
  Mail, 
  ChevronRight, 
  MessageSquare,
  UserPlus,
  Gavel,
  ShieldAlert,
  Loader2,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { treasuryService } from '@/services/treasury';
import { formatCurrency } from '@/lib/format';
import { useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { toast } from 'sonner';

export default function CollectionsClient() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await treasuryService.getCollectionPriority();
      setQueue(res);
    } catch (error) {
      toast.error('Erreur lors du chargement de la file de recouvrement');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 1000000) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (score > 500000) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Calcul du score de risque...</p>
      </div>
    );
  }

  const filteredQueue = queue.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
              <AlertCircle className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">File de Recouvrement</h1>
          </div>
          <p className="text-slate-500 font-medium ml-13">Priorisation automatique par Score de Risque (Montant × Ancienneté).</p>
        </div>
        
        <button 
          onClick={() => {
             toast.promise(treasuryService.sendDailyReminders(), {
               loading: 'Envoi des rappels automatiques...',
               success: (data) => `${data.total} rappels envoyés avec succès`,
               error: 'Erreur lors de l\'envoi'
             });
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
        >
          <Mail size={20} />
          Envoyer les Rappels du Jour
        </button>
      </div>

      {/* Main Queue */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-4xl overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un dossier prioritaire..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/10 transition-all font-bold text-slate-900 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priorité / Client</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Overdue</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Max Delay</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Risk Score</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Action</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredQueue.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-300 group-hover:text-rose-600 transition-colors">#{index + 1}</span>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight text-base">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oldest: {item.oldestInvoiceRef}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <p className="font-black text-slate-900">{formatCurrency(item.totalOverdue)}</p>
                    </td>
                    <td className="px-6 py-6 text-right font-bold text-rose-600">{item.daysOverdue} days</td>
                    <td className="px-6 py-6 text-center">
                      <Badge className={`px-3 py-1 font-black text-xs border ${getRiskColor(item.riskScore)}`}>
                        {Math.floor(item.riskScore).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="px-6 py-6">
                      {item.lastActivity ? (
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-700">{item.lastActivity.activityType}</span>
                           <span className="text-[10px] text-slate-400 font-medium">{new Date(item.lastActivity.createdAt).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">No contact yet</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-emerald-600 shadow-sm hover:bg-emerald-600 hover:text-white transition-all"><Phone size={18} /></button>
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Mail size={18} /></button>
                        <Link 
                          href={`/treasury/customers/${item.id}/aging` as any}
                          className="p-3 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 font-bold text-xs pl-4"
                        >
                          Dossier
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="border-none shadow-xl shadow-slate-100 bg-white p-8">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare size={24} />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">Relance Amiable</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Priorisez les scores {"<"} 500k. Un simple appel ou email suffit souvent à débloquer la situation.</p>
         </Card>
         <Card className="border-none shadow-xl shadow-slate-100 bg-white p-8">
            <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert size={24} />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">Mise en Demeure</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Pour les scores entre 500k et 1M. Envoyez un rappel formel avec menace de blocage de compte.</p>
         </Card>
         <Card className="border-none shadow-xl shadow-slate-100 bg-white p-8">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
              <Gavel size={24} />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">Contentieux</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Scores {">"} 1M. Transférez le dossier au service juridique pour recouvrement forcé.</p>
         </Card>
      </div>
    </div>
  );
}
