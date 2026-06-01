import React from 'react';
import { Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface KPICardsProps {
  totalCustomers: number;
  totalRevenue: number;
  totalEncours: number;
  avgDso: number;
}

export function CustomerKPICards({ totalCustomers, totalRevenue, totalEncours, avgDso }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Clients */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Users size={80} />
        </div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">Total Clients</h3>
        </div>
        <div className="relative z-10">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">
            {totalCustomers}
          </span>
        </div>
      </div>

      {/* CA Total Période */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <TrendingUp size={80} />
        </div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">Chiffre d'Affaires</h3>
        </div>
        <div className="relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(totalRevenue)}
            </span>
            <span className="text-sm font-bold text-slate-400">DA</span>
          </div>
        </div>
      </div>

      {/* Encours Total */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <AlertCircle size={80} />
        </div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">Encours Total</h3>
        </div>
        <div className="relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(totalEncours)}
            </span>
            <span className="text-sm font-bold text-slate-400">DA</span>
          </div>
        </div>
      </div>

      {/* DSO */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Clock size={80} />
        </div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">Délai Paiement Moyen</h3>
        </div>
        <div className="relative z-10 flex items-end gap-2">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">
            {avgDso}
          </span>
          <span className="text-sm font-bold text-slate-400 mb-1">jours</span>
        </div>
      </div>
    </div>
  );
}
