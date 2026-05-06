'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  AlertCircle, 
  Clock, 
  Calendar,
  ChevronRight,
  Mail,
  Phone,
  BarChart3,
  Loader2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { treasuryService, AgedReceivablesData } from '@/services/treasury';
import { formatCurrency } from '@/lib/format';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { toast } from 'sonner';

export default function AgedReceivablesClient() {
  const t = useTranslations('treasury');
  const ct = useTranslations('common');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AgedReceivablesData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await treasuryService.getAgedReceivables();
      setData(res);
    } catch (error) {
      toast.error('Erreur lors du chargement de la balance agée');
    } finally {
      setLoading(false);
    }
  };

  const getBehaviorBadge = (behavior: string) => {
    switch (behavior) {
      case 'EXCELLENT':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-black tracking-widest">EXCELLENT</Badge>;
      case 'GOOD':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-black tracking-widest">GOOD</Badge>;
      case 'POOR':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[9px] font-black tracking-widest">POOR</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[9px] font-black tracking-widest">AVERAGE</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Chargement de la balance agée...</p>
      </div>
    );
  }

  const filteredCustomers = data?.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <History className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Balance Agée</h1>
          </div>
          <p className="text-slate-500 font-medium ml-13">Suivi et recouvrement des créances clients par ancienneté.</p>
        </div>
        
        <div className="flex gap-3">
          <Link 
            href="/treasury/collections"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95"
          >
            <AlertCircle size={20} className="text-blue-600" />
            File de Recouvrement
          </Link>
          <Link 
            href="/treasury/forecast"
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
          >
            <TrendingUp size={20} />
            Prévisionnel Cash
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 bg-white overflow-hidden group">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-blue-600 transition-colors">Total Outstanding</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(data?.summary.totalOutstanding || 0)}</h3>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current (0-30j)</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(data?.summary.current || 0)}</h3>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${((data?.summary.current || 0) / (data?.summary.totalOutstanding || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-4">Late (30-60j)</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(data?.summary.late30 || 0)}</h3>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${((data?.summary.late30 || 0) / (data?.summary.totalOutstanding || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-4">Late (60-90j)</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(data?.summary.late60 || 0)}</h3>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${((data?.summary.late60 || 0) / (data?.summary.totalOutstanding || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-4">Critical (90j+)</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(data?.summary.late90 || 0)}</h3>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600 transition-all duration-1000" style={{ width: `${((data?.summary.late90 || 0) / (data?.summary.totalOutstanding || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-4xl overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un client..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Filter size={20} /></button>
             <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Calendar size={20} /></button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Outstanding</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">0-30j</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">30-60j</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">60-90j</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">90j+</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Behavior</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight">{customer.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Delay: {customer.avgPaymentDelay} days</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right font-black text-slate-900">{formatCurrency(customer.totalOutstanding)}</td>
                    <td className="px-6 py-6 text-right font-bold text-slate-500">{formatCurrency(customer.current)}</td>
                    <td className="px-6 py-6 text-right font-bold text-amber-600">{formatCurrency(customer.late30)}</td>
                    <td className="px-6 py-6 text-right font-bold text-orange-600">{formatCurrency(customer.late60)}</td>
                    <td className="px-6 py-6 text-right font-bold text-rose-600">{formatCurrency(customer.late90)}</td>
                    <td className="px-6 py-6">
                      {getBehaviorBadge(customer.paymentBehavior)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link 
                        href={`/treasury/customers/${customer.id}/aging`}
                        className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-lg hover:shadow-blue-100 transition-all inline-flex"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
