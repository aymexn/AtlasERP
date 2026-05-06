'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  Calendar,
  DollarSign,
  Loader2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { treasuryService } from '@/services/treasury';
import { formatCurrency } from '@/lib/format';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

export default function ForecastClient() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await treasuryService.getForecast();
      setForecast(res);
    } catch (error) {
      toast.error('Erreur lors du calcul du prévisionnel');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Projection des flux de trésorerie...</p>
      </div>
    );
  }

  const maxVal = Math.max(...forecast.map(d => Math.abs(d.projectedBalance)), 1);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <LineChartIcon className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Prévisionnel Cash Flow</h1>
          </div>
          <p className="text-slate-500 font-medium ml-13">Projection sur 30 jours basée sur les échéances factures et achats.</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Cash (30j)</p>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(forecast[30]?.projectedBalance || 0)}</h3>
              <div className={`p-2 rounded-lg ${(forecast[30]?.projectedBalance || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {(forecast[30]?.projectedBalance || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Expected In (30j)</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(forecast.reduce((sum, d) => sum + d.inflow, 0))}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Expected Out (30j)</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(forecast.reduce((sum, d) => sum + d.outflow, 0))}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-100 bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Alertes Liquidité</p>
            <div className="flex items-center gap-2">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">{forecast.filter(d => d.projectedBalance < 0).length}</h3>
               <span className="text-xs font-bold text-slate-400">jours à risque</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Chart Area */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-4xl bg-white overflow-hidden p-8">
        <div className="flex items-center justify-between mb-12">
           <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Calendar className="text-blue-600" size={20} />
             Evolution du Solde Prévisionnel
           </h4>
           <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inflow</span>
             </div>
           </div>
        </div>

        <div className="h-[300px] flex items-end gap-1 relative border-b border-slate-100">
           {forecast.map((day, idx) => {
              const height = (Math.abs(day.balance) / maxVal) * 100;
              const isPositive = day.balance >= 0;
              return (
                <div key={idx} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                  {/* Tooltip */}
                  <div className="absolute -top-16 bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 whitespace-nowrap shadow-xl">
                    {new Date(day.date).toLocaleDateString()}<br/>
                    Balance: {formatCurrency(day.projectedBalance)}<br/>
                    Net: {formatCurrency(day.netPosition)}
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-700 group-hover:opacity-80 ${day.projectedBalance >= 0 ? 'bg-blue-600' : 'bg-rose-500'}`}
                    style={{ height: `${Math.max(2, (Math.abs(day.projectedBalance) / maxVal) * 100)}%` }}
                  />
                  
                  {/* Date Label (Every 5 days) */}
                  {idx % 5 === 0 && (
                    <span className="absolute -bottom-6 text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                      {new Date(day.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              );
           })}
        </div>
      </Card>

      {/* Detailed Forecast List */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-4xl bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
           <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Timeline des Échéances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                   <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                   <th className="px-6 py-5 text-right text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inflow (+)</th>
                   <th className="px-6 py-5 text-right text-[10px] font-black text-rose-600 uppercase tracking-widest">Outflow (-)</th>
                   <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Position</th>
                   <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {forecast.filter(d => d.netPosition !== 0).map((day, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5">
                       <span className="font-black text-slate-900">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'long' })}</span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-emerald-600">
                      {day.inflow > 0 ? `+${formatCurrency(day.inflow)}` : '-'}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-rose-600">
                      {day.outflow > 0 ? `-${formatCurrency(day.outflow)}` : '-'}
                    </td>
                    <td className={`px-6 py-5 text-right font-black ${day.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(day.netPosition)}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">
                      <div className="flex items-center justify-end gap-2">
                        {formatCurrency(day.projectedBalance)}
                        {day.projectedBalance < 0 && <AlertTriangle size={14} className="text-amber-500" />}
                      </div>
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
