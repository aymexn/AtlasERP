'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Info, AlertCircle } from 'lucide-react';

interface MarginGaugeProps {
  salePriceHt: number;
  costPrice: number;
}

export const MarginGauge: React.FC<MarginGaugeProps> = ({ salePriceHt, costPrice }) => {
  const t = useTranslations('products');

  const margin = salePriceHt - costPrice;
  const marginPercent = salePriceHt > 0 ? (margin / salePriceHt) * 100 : 0;

  // Jauge colorée : rouge < 10%, orange 10-30%, vert > 30%
  let colorClass = 'bg-rose-500';
  let textClass = 'text-rose-500';
  let bgClass = 'bg-rose-50';
  let borderClass = 'border-rose-100';
  let statusText = 'Marge faible (action requise)';

  if (marginPercent >= 30) {
    colorClass = 'bg-emerald-500';
    textClass = 'text-emerald-600';
    bgClass = 'bg-emerald-50/50';
    borderClass = 'border-emerald-100';
    statusText = 'Marge saine';
  } else if (marginPercent >= 10) {
    colorClass = 'bg-amber-500';
    textClass = 'text-amber-600';
    bgClass = 'bg-amber-50/50';
    borderClass = 'border-amber-100';
    statusText = 'Marge modérée';
  }

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${bgClass} ${borderClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Rentabilité Estimée
          </h4>
          <p className={`text-sm font-black mt-1 ${textClass}`}>
            {statusText}
          </p>
        </div>
        <div className="relative group">
          <Info size={16} className="text-slate-400 cursor-help hover:text-slate-600 transition-colors" />
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 text-white text-[10px] font-medium p-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 leading-relaxed">
            La marge brute est calculée comme suit : <br />
            <span className="font-mono font-black">((Prix de Vente HT - Coût de Revient) / Prix de Vente HT) * 100</span>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-4xl font-black tracking-tight ${textClass}`}>
          {marginPercent.toFixed(1)}%
        </span>
        <span className="text-xs font-bold text-slate-400">de marge brute</span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, marginPercent))}%` }}
        />
      </div>

      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
        <span>Faible (&lt;10%)</span>
        <span>Moyen (10-30%)</span>
        <span>Sain (&gt;30%)</span>
      </div>

      {marginPercent < 10 && salePriceHt > 0 && (
        <div className="mt-4 flex items-center gap-2 text-rose-600 bg-white p-3 rounded-2xl border border-rose-100 text-[10px] font-black uppercase tracking-wider">
          <AlertCircle size={14} className="shrink-0 animate-pulse" />
          <span>Attention : Prix de vente inférieur ou très proche du coût !</span>
        </div>
      )}
    </div>
  );
};
