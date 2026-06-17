'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  Calendar,
  Loader2,
  ChevronRight,
  ChevronDown,
  Download,
  Sparkles,
  Filter,
  CheckCircle2,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { treasuryService } from '@/services/treasury';
import { formatCurrency } from '@/lib/format';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

export default function ForecastClient() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any[]>([]);
  const [days, setDays] = useState<number>(30);
  const [activeTableFilter, setActiveTableFilter] = useState<'all' | 'inflow' | 'outflow' | 'negatives'>('all');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // AI analysis typing state
  const [aiAnalysis, setAiAnalysis] = useState<{ positive: string; warning: string; recommendation: string } | null>(null);
  const [typedPositive, setTypedPositive] = useState('');
  const [typedWarning, setTypedWarning] = useState('');
  const [typedRecommendation, setTypedRecommendation] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string>('');

  useEffect(() => {
    loadForecast(days);
  }, [days]);

  const loadForecast = async (targetDays: number) => {
    try {
      setLoading(true);
      const res = await treasuryService.getForecast(targetDays);
      setForecast(res || []);
      generateAIAnalysis(res || [], targetDays);
    } catch (error) {
      toast.error('Erreur lors du calcul du prévisionnel de trésorerie.');
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic, context-aware AI comments based on loaded data
  const generateAIAnalysis = (data: any[], daysCount: number) => {
    if (data.length === 0) return;

    const totalInflow = data.reduce((sum, d) => sum + d.inflow, 0);
    const totalOutflow = data.reduce((sum, d) => sum + d.outflow, 0);
    const coverRatio = totalOutflow > 0 ? (totalInflow / totalOutflow) * 100 : 100;
    
    // Find negative days
    const negativeDays = data.filter(d => d.projectedBalance < 0);
    
    // Find lowest point
    const lowestPointIdx = data.reduce((minIdx, current, idx, arr) => 
      current.projectedBalance < arr[minIdx].projectedBalance ? idx : minIdx, 0);
    const lowestPoint = data[lowestPointIdx];
    const lowestAmount = lowestPoint?.projectedBalance || 0;
    const lowestDateStr = lowestPoint ? new Date(lowestPoint.date).toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' }) : '';

    const positiveComment = `Couverture Globale Saine : Sur les ${daysCount} prochains jours, Cameleon Colors dégage un volume d'encaissements prévus de ${formatCurrency(totalInflow)}. Votre capacité de couverture globale des charges se situe à ${coverRatio.toFixed(1)}%, indiquant un matelas de sécurité convenable face aux engagements d'achat.`;
    
    let warningComment = `Aucun risque de découvert critique détecté sur la période projetée de ${daysCount} jours. Votre solde de liquidité disponible minimal reste confortable à ${formatCurrency(Math.max(0, lowestAmount))}.`;
    if (negativeDays.length > 0) {
      warningComment = `Trésorerie tendue le ${lowestDateStr} : Le solde net cumulé projeté franchit une ligne critique avec un creux de découvert estimé à ${formatCurrency(lowestAmount)} le ${lowestDateStr}. Au total, ${negativeDays.length} jours présentent un risque d'insuffisance de fonds propres de roulement.`;
    }

    let recommendationComment = `Placement d'excédent : Le solde disponible demeurant systématiquement positif, il est recommandé d'allouer ${formatCurrency(lowestAmount * 0.4)} vers des placements de trésorerie à court terme ou d'accélérer le règlement de certaines factures fournisseurs pour escompte.`;
    if (negativeDays.length > 0) {
      recommendationComment = `Action requise : Négocier le décalage de paiement de commandes d'achats d'un montant de ${formatCurrency(Math.abs(lowestAmount) * 1.15)} ou actionner le recouvrement ciblé de factures de clients à comportement de paiement excellent pour combler le déficit du ${lowestDateStr}.`;
    }

    setAiAnalysis({
      positive: positiveComment,
      warning: warningComment,
      recommendation: recommendationComment
    });

    // Reset typing effect states
    setTypedPositive('');
    setTypedWarning('');
    setTypedRecommendation('');
    setTypingIndex(0);

    const now = new Date();
    setLastGeneratedTime(now.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // Run typing simulation
  useEffect(() => {
    if (!aiAnalysis) return;

    let timer: NodeJS.Timeout;
    
    const typeNextChar = () => {
      if (typedPositive.length < aiAnalysis.positive.length) {
        setTypedPositive(prev => prev + aiAnalysis.positive.charAt(prev.length));
      } else if (typedWarning.length < aiAnalysis.warning.length) {
        setTypedWarning(prev => prev + aiAnalysis.warning.charAt(prev.length));
      } else if (typedRecommendation.length < aiAnalysis.recommendation.length) {
        setTypedRecommendation(prev => prev + aiAnalysis.recommendation.charAt(prev.length));
      }
    };

    if (
      typedPositive.length < aiAnalysis.positive.length ||
      typedWarning.length < aiAnalysis.warning.length ||
      typedRecommendation.length < aiAnalysis.recommendation.length
    ) {
      timer = setTimeout(typeNextChar, 8); // Fast typing speed
    }

    return () => clearTimeout(timer);
  }, [aiAnalysis, typedPositive, typedWarning, typedRecommendation]);

  // Exporters
  const exportCSV = () => {
    if (forecast.length === 0) return;
    const headers = ['Date', 'Inflow (Encaissement)', 'Outflow (Decaissement)', 'Position Nette', 'Solde Cumule Projete'];
    const rows = forecast.map(day => [
      new Date(day.date).toLocaleDateString('fr-DZ'),
      day.inflow.toFixed(2),
      day.outflow.toFixed(2),
      day.netPosition.toFixed(2),
      day.projectedBalance.toFixed(2)
    ]);
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AtlasERP_Previsionnel_Tresorerie_${days}_jours.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Le fichier CSV a été exporté avec succès.');
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Projection des flux de trésorerie en cours...</p>
      </div>
    );
  }

  // Summary Metrics calculations
  const currentActualBalance = forecast[0]?.projectedBalance - forecast[0]?.netPosition || 0;
  const netFinPeriod = forecast[forecast.length - 1]?.projectedBalance || 0;
  const totalInflow = forecast.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = forecast.reduce((sum, d) => sum + d.outflow, 0);
  const negativeBalanceDaysCount = forecast.filter(d => d.projectedBalance < 0).length;
  const coverRatio = totalOutflow > 0 ? (totalInflow / totalOutflow) * 100 : 100;

  // Mini sparkline data
  const sparklineBalances = forecast.map(d => d.projectedBalance);

  // SVG Sparkline path generator
  const getSparklinePath = (data: number[]) => {
    if (data.length === 0) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 140;
    const h = 42;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * h;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // SVG Charts Coordinate calculations
  const svgWidth = 860;
  const svgHeight = 280;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find scale maximums for charts
  const maxInflowOutflow = Math.max(...forecast.map(d => Math.max(d.inflow, d.outflow)), 100000);
  const balanceValues = forecast.map(d => d.projectedBalance);
  const maxBalance = Math.max(...balanceValues, 100000);
  const minBalance = Math.min(...balanceValues, 0);
  const balanceRange = maxBalance - minBalance || 1;

  // Find lowest critical point
  const lowestPointIndex = forecast.reduce((minIdx, current, idx, arr) => 
    current.projectedBalance < arr[minIdx].projectedBalance ? idx : minIdx, 0);
  const lowestPoint = forecast[lowestPointIndex];

  // Helper coordinate getters
  const getX = (index: number) => paddingLeft + (index / (forecast.length - 1)) * chartWidth;
  
  // Projected balance y coordinate
  const getBalanceY = (val: number) => 
    paddingTop + chartHeight - ((val - minBalance) / balanceRange) * chartHeight;

  // Inflow/Outflow bar height
  const getBarHeight = (val: number) => (val / maxInflowOutflow) * chartHeight;

  // Table row filter
  const filteredForecast = forecast.filter((day) => {
    if (activeTableFilter === 'all') return day.netPosition !== 0 || day.inflow > 0 || day.outflow > 0;
    if (activeTableFilter === 'inflow') return day.inflow > 0;
    if (activeTableFilter === 'outflow') return day.outflow > 0;
    if (activeTableFilter === 'negatives') return day.projectedBalance < 0;
    return true;
  });

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0 print:bg-white print:space-y-4">
      
      {/* Header (with print controls hidden during print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <LineChartIcon className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Prévisionnel de Trésorerie</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Estimation en temps réel des encaissements pondérés par comportement client et décaissements opérationnels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden select-none">
          {/* Days selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/50">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  days === d
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {d} Jours
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={14} />
            Exporter CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileText size={14} />
            Imprimer Recap
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Net Cash Card */}
        <Card className="border-none shadow-xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Cash Projeté</p>
              <h3 className="text-xl font-black tracking-tight">{formatCurrency(netFinPeriod)}</h3>
            </div>
            
            <div className="flex items-end justify-between">
              <span className="text-[10px] text-slate-400 font-bold">Flux cumulatif fin période</span>
              {/* Mini Sparkline SVG */}
              <svg className="w-24 h-8 overflow-visible" viewBox="0 0 140 42">
                <path
                  d={getSparklinePath(sparklineBalances)}
                  fill="none"
                  stroke={netFinPeriod >= currentActualBalance ? '#10B981' : '#F43F5E'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Expected In Card */}
        <Card className="border border-emerald-100 shadow-xl shadow-slate-100 bg-emerald-50/20 text-emerald-950">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-2">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Entrées Prévues (+)</p>
              <h3 className="text-xl font-black tracking-tight text-emerald-900">{formatCurrency(totalInflow)}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <ArrowUpRight size={16} />
              <span>Pondéré par comportement client</span>
            </div>
          </CardContent>
        </Card>

        {/* Expected Out Card */}
        <Card className="border border-rose-100 shadow-xl shadow-slate-100 bg-rose-50/20 text-rose-950">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-2">
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Sorties Prévues (-)</p>
              <h3 className="text-xl font-black tracking-tight text-rose-900">{formatCurrency(totalOutflow)}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold">
              <ArrowDownRight size={16} />
              <span>Factures d'achat & frais d'usine</span>
            </div>
          </CardContent>
        </Card>

        {/* Cover Ratio Card */}
        <Card className={`border shadow-xl shadow-slate-100 bg-white ${
          coverRatio >= 100 ? 'border-emerald-100' : coverRatio >= 70 ? 'border-amber-100' : 'border-rose-100'
        }`}>
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ratio de Couverture</p>
              <h3 className="text-xl font-black tracking-tight text-slate-900">{coverRatio.toFixed(1)}%</h3>
            </div>
            
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    coverRatio >= 100 ? 'bg-emerald-500' : coverRatio >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, coverRatio)}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Entrées / Sorties</span>
            </div>
          </CardContent>
        </Card>

        {/* Liquidity Alerts Card */}
        <Card className={`border shadow-xl shadow-slate-100 bg-white ${
          negativeBalanceDaysCount > 0 ? 'border-amber-100' : 'border-emerald-100'
        }`}>
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertes Trésorerie</p>
              <h3 className="text-xl font-black tracking-tight text-slate-900">
                {negativeBalanceDaysCount} {negativeBalanceDaysCount > 1 ? 'Alertes' : 'Alerte'}
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {negativeBalanceDaysCount > 0 ? (
                <>
                  <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                  <span className="text-amber-700">Risque de solde négatif</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                  <span className="text-emerald-700">Aucune alerte de liquidité</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SVG Combo Chart (Inflow/Outflow bars & Projected Balance line) */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-2xl bg-white overflow-hidden p-8 print:border print:shadow-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="text-blue-600" size={18} />
              Évolution et Balance Quotidienne
            </h4>
            <p className="text-xs text-slate-400 font-medium">Flux quotidien d'entrées/sorties et projection du solde de trésorerie cumulé.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 select-none">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 block" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inflows</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 block" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outflows</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-blue-600 block" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Cumulé</span>
            </div>
          </div>
        </div>

        {/* SVG Container */}
        <div className="relative overflow-x-auto scrollbar-none">
          <svg className="w-full min-w-[760px] h-[280px]" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              {/* Gradients */}
              <linearGradient id="blue-line-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
              const y = paddingTop + chartHeight * ratio;
              const value = maxBalance - (ratio * (maxBalance - minBalance));
              return (
                <g key={gridIdx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={svgWidth - paddingRight} 
                    y2={y} 
                    stroke="#F1F5F9" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={paddingLeft - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-[9px] font-bold fill-slate-400"
                  >
                    {Math.round(value / 1000)}k DA
                  </text>
                </g>
              );
            })}

            {/* Inflow/Outflow Bars */}
            {forecast.map((day, idx) => {
              const x = getX(idx);
              const barWidthMax = Math.max(2, (chartWidth / forecast.length) * 0.35);
              const inflowH = getBarHeight(day.inflow);
              const outflowH = getBarHeight(day.outflow);
              
              return (
                <g key={`bars-${idx}`}>
                  {/* Inflow Bar (Green) */}
                  {day.inflow > 0 && (
                    <rect
                      x={x - barWidthMax - 1}
                      y={paddingTop + chartHeight - inflowH}
                      width={barWidthMax}
                      height={inflowH}
                      fill="#10B981"
                      rx="1"
                      className="opacity-80"
                    />
                  )}
                  {/* Outflow Bar (Red) */}
                  {day.outflow > 0 && (
                    <rect
                      x={x + 1}
                      y={paddingTop + chartHeight - outflowH}
                      width={barWidthMax}
                      height={outflowH}
                      fill="#F43F5E"
                      rx="1"
                      className="opacity-80"
                    />
                  )}
                </g>
              );
            })}

            {/* Projected Balance Line */}
            <path
              d={`M ${forecast.map((day, idx) => `${getX(idx)},${getBalanceY(day.projectedBalance)}`).join(' L ')}`}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots for the balance line */}
            {forecast.map((day, idx) => (
              <circle
                key={`dot-${idx}`}
                cx={getX(idx)}
                cy={getBalanceY(day.projectedBalance)}
                r={hoveredIdx === idx ? 5 : 2}
                fill={hoveredIdx === idx ? '#2563EB' : '#FFFFFF'}
                stroke="#2563EB"
                strokeWidth={hoveredIdx === idx ? 2 : 1.5}
                className="transition-all"
              />
            ))}

            {/* Current Balance Reference Line (Dashed horizontal) */}
            <line
              x1={paddingLeft}
              y1={getBalanceY(currentActualBalance)}
              x2={svgWidth - paddingRight}
              y2={getBalanceY(currentActualBalance)}
              stroke="#64748B"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              opacity="0.6"
            />
            <text
              x={svgWidth - paddingRight - 10}
              y={getBalanceY(currentActualBalance) - 6}
              textAnchor="end"
              className="text-[9px] font-black fill-slate-500 uppercase tracking-widest"
            >
              Solde Actuel : {Math.round(currentActualBalance / 1000)}k DA
            </text>

            {/* Date Labels on X Axis (Every 5 days) */}
            {forecast.map((day, idx) => {
              if (idx % (days === 90 ? 10 : 5) !== 0) return null;
              return (
                <text
                  key={`lbl-${idx}`}
                  x={getX(idx)}
                  y={svgHeight - 15}
                  textAnchor="middle"
                  className="text-[9px] font-black fill-slate-400 uppercase tracking-tighter"
                >
                  {new Date(day.date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                </text>
              );
            })}

            {/* Interactive slices for tooltips */}
            {forecast.map((day, idx) => {
              const x = getX(idx);
              const sliceWidth = chartWidth / (forecast.length - 1);
              return (
                <rect
                  key={`slice-${idx}`}
                  x={x - sliceWidth / 2}
                  y={paddingTop}
                  width={sliceWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIdx !== null && forecast[hoveredIdx] && (
            <div 
              className="absolute bg-slate-900 text-white p-4 rounded-xl text-xs font-bold shadow-xl border border-slate-800 z-10 pointer-events-none space-y-1.5 transition-all w-56"
              style={{
                left: `${Math.min(svgWidth - 240, Math.max(20, getX(hoveredIdx) - 110))}px`,
                top: `${Math.max(10, getBalanceY(forecast[hoveredIdx].projectedBalance) - 120)}px`
              }}
            >
              <div className="border-b border-slate-800 pb-1 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">
                  {new Date(forecast[hoveredIdx].date).toLocaleDateString('fr-DZ', { weekday: 'short', day: 'numeric', month: 'long' })}
                </span>
                {forecast[hoveredIdx].projectedBalance < 0 && (
                  <span className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.25 rounded">Risque</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entrées (+) :</span>
                <span className="text-emerald-400">+{formatCurrency(forecast[hoveredIdx].inflow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sorties (-) :</span>
                <span className="text-rose-400">-{formatCurrency(forecast[hoveredIdx].outflow)}</span>
              </div>
              <div className="flex justify-between font-extrabold border-t border-slate-800 pt-1">
                <span>Solde Projeté :</span>
                <span className={forecast[hoveredIdx].projectedBalance >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                  {formatCurrency(forecast[hoveredIdx].projectedBalance)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cumulative running balance chart with Gradient Fill (Flux Cumulatif) */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-2xl bg-white overflow-hidden p-8 print:border print:shadow-none">
        <div className="mb-6">
          <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <LineChartIcon className="text-blue-600" size={18} />
            Tendance Cumulative & Point Critique
          </h4>
          <p className="text-xs text-slate-400 font-medium">Visualisation de la trajectoire globale de cash avec ciblage du solde plancher.</p>
        </div>

        {/* SVG Cumulative Chart */}
        <div className="relative">
          <svg className="w-full min-w-[760px] h-[220px]" viewBox={`0 0 ${svgWidth} 220`}>
            <defs>
              <linearGradient id="cumul-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Zero balance line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight - ((0 - minBalance) / balanceRange) * chartHeight * 0.7}
              x2={svgWidth - paddingRight}
              y2={paddingTop + chartHeight - ((0 - minBalance) / balanceRange) * chartHeight * 0.7}
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />

            {/* Gradient Area path */}
            <path
              d={`
                M ${getX(0)},${paddingTop + chartHeight}
                L ${forecast.map((day, idx) => `${getX(idx)},${paddingTop + chartHeight - ((day.projectedBalance - minBalance) / balanceRange) * chartHeight * 0.7}`).join(' L ')}
                L ${getX(forecast.length - 1)},${paddingTop + chartHeight}
                Z
              `}
              fill="url(#cumul-gradient)"
            />

            {/* Trend Line */}
            <path
              d={`M ${forecast.map((day, idx) => `${getX(idx)},${paddingTop + chartHeight - ((day.projectedBalance - minBalance) / balanceRange) * chartHeight * 0.7}`).join(' L ')}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Highlight lowest point */}
            {lowestPoint && (
              <g>
                {/* Vertical marker line */}
                <line
                  x1={getX(lowestPointIndex)}
                  y1={paddingTop + chartHeight - ((lowestPoint.projectedBalance - minBalance) / balanceRange) * chartHeight * 0.7}
                  x2={getX(lowestPointIndex)}
                  y2={paddingTop + chartHeight}
                  stroke="#F43F5E"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                {/* Pulsing indicator */}
                <circle
                  cx={getX(lowestPointIndex)}
                  cy={paddingTop + chartHeight - ((lowestPoint.projectedBalance - minBalance) / balanceRange) * chartHeight * 0.7}
                  r="9"
                  fill="#F43F5E"
                  opacity="0.2"
                  className="animate-ping"
                />
                <circle
                  cx={getX(lowestPointIndex)}
                  cy={paddingTop + chartHeight - ((lowestPoint.projectedBalance - minBalance) / balanceRange) * chartHeight * 0.7}
                  r="5"
                  fill="#F43F5E"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                {/* Text anchor */}
                <text
                  x={getX(lowestPointIndex)}
                  y={paddingTop + chartHeight - ((lowestPoint.projectedBalance - minBalance) / balanceRange) * chartHeight * 0.7 - 12}
                  textAnchor="middle"
                  className="text-[9px] font-black fill-rose-600 bg-white"
                >
                  Point Critique : {formatCurrency(lowestPoint.projectedBalance)}
                </text>
              </g>
            )}

            {/* X Labels */}
            {forecast.map((day, idx) => {
              if (idx % (days === 90 ? 15 : 7) !== 0) return null;
              return (
                <text
                  key={`lbl-cum-${idx}`}
                  x={getX(idx)}
                  y={210}
                  textAnchor="middle"
                  className="text-[9px] font-black fill-slate-400 uppercase tracking-tighter"
                >
                  {new Date(day.date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                </text>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* AI Analysis Panel */}
      <Card className="border border-blue-100 shadow-xl shadow-blue-50/50 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 rounded-2xl overflow-hidden p-6 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 print:hidden select-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Généré par Atlas AI {lastGeneratedTime && `à ${lastGeneratedTime}`}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600 w-5 h-5" />
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Analyse IA - Trésorerie Cameleon Colors</h4>
          </div>

          {loading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed font-medium">
              
              {/* Positive point */}
              {typedPositive && (
                <div className="flex gap-2.5 items-start bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
                  <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp size={12} />
                  </div>
                  <div>
                    <span className="font-extrabold text-emerald-800 block text-[10px] uppercase tracking-wider mb-0.5">Perspective Positive</span>
                    {typedPositive}
                  </div>
                </div>
              )}

              {/* Warning point */}
              {typedWarning && (
                <div className="flex gap-2.5 items-start bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
                  <div className="w-5 h-5 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={12} />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-800 block text-[10px] uppercase tracking-wider mb-0.5">Point de Vigilance</span>
                    {typedWarning}
                  </div>
                </div>
              )}

              {/* Recommendation point */}
              {typedRecommendation && (
                <div className="flex gap-2.5 items-start bg-slate-900 text-white p-3.5 rounded-xl shadow-md animate-in fade-in duration-300">
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} />
                  </div>
                  <div>
                    <span className="font-extrabold text-blue-400 block text-[10px] uppercase tracking-wider mb-0.5">Recommandation Stratégique</span>
                    {typedRecommendation}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </Card>

      {/* Detailed Forecast List Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-2xl bg-white overflow-hidden print:border print:shadow-none">
        
        {/* Table Filters */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 select-none">
          <h4 className="text-base font-black text-slate-800 tracking-tight">Timeline des Flux de Trésorerie</h4>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-slate-400 mr-1" />
            {[
              { id: 'all', label: 'Toutes les échéances' },
              { id: 'inflow', label: 'Entrées (+)' },
              { id: 'outflow', label: 'Sorties (-)' },
              { id: 'negatives', label: 'Soldes négatifs' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveTableFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTableFilter === f.id
                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Table */}
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-[16px]" />
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Échéance</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-emerald-600 uppercase tracking-widest">Entrées Prévues (+)</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-rose-600 uppercase tracking-widest">Sorties Prévues (-)</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Position Nette</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Projeté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredForecast.map((day, idx) => {
                  const isExpanded = !!expandedRows[idx];
                  const hasDetails = day.items && day.items.length > 0;

                  return (
                    <Fragment key={idx}>
                      <tr 
                        onClick={() => hasDetails && toggleRow(idx)}
                        className={`group hover:bg-slate-50/30 transition-all cursor-pointer ${
                          day.projectedBalance < 0 ? 'bg-rose-50/5' : ''
                        }`}
                      >
                        <td className="px-8 py-5 text-center">
                          {hasDetails && (
                            <ChevronDown 
                              size={16} 
                              className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                            />
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <span className="font-extrabold text-slate-800">
                            {new Date(day.date).toLocaleDateString('fr-DZ', { weekday: 'short', day: '2-digit', month: 'long' })}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-emerald-600">
                          {day.inflow > 0 ? `+${formatCurrency(day.inflow)}` : '—'}
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-rose-600">
                          {day.outflow > 0 ? `-${formatCurrency(day.outflow)}` : '—'}
                        </td>
                        <td className={`px-6 py-5 text-right font-black ${day.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {day.netPosition !== 0 ? formatCurrency(day.netPosition) : '—'}
                        </td>
                        <td className="px-8 py-5 text-right font-black">
                          <div className="flex items-center justify-end gap-2">
                            <span className={day.projectedBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                              {formatCurrency(day.projectedBalance)}
                            </span>
                            {day.projectedBalance < 0 && <AlertTriangle size={14} className="text-rose-500 shrink-0" />}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && hasDetails && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={6} className="px-12 py-4 border-t border-slate-50">
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Détails des Transactions du Jour
                              </p>
                              
                              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-150 overflow-hidden">
                                {day.items.map((item: any, itemIdx: number) => (
                                  <div key={itemIdx} className="px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-700">
                                    <div className="flex items-center gap-3">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                        item.type === 'INFLOW' 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                                      }`}>
                                        {item.type === 'INFLOW' ? 'Entrée' : 'Sortie'}
                                      </span>
                                      <div>
                                        <span className="text-slate-900 font-extrabold">{item.reference}</span>
                                        <span className="text-slate-400 font-medium ml-2">— {item.label}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <span className={item.type === 'INFLOW' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                                        {item.type === 'INFLOW' ? '+' : '-'}{formatCurrency(item.amount)}
                                      </span>
                                      {item.type === 'INFLOW' && item.weightedAmount !== item.amount && (
                                        <span className="text-[10px] text-slate-400 font-medium block">
                                          Pondéré (Proba) : {formatCurrency(item.weightedAmount)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>

              {/* Summary Totals Row */}
              <tfoot>
                <tr className="bg-slate-100/50 border-t border-slate-200 font-black text-slate-900">
                  <td className="px-8 py-5 text-left w-[16px]" />
                  <td className="px-4 py-5 text-left text-xs uppercase tracking-wider">Total Cumulative</td>
                  <td className="px-6 py-5 text-right text-emerald-600 text-sm">+{formatCurrency(totalInflow)}</td>
                  <td className="px-6 py-5 text-right text-rose-600 text-sm">-{formatCurrency(totalOutflow)}</td>
                  <td className="px-6 py-5 text-right text-sm text-slate-800">
                    {formatCurrency(totalInflow - totalOutflow)}
                  </td>
                  <td className="px-8 py-5 text-right text-base text-blue-600">
                    {formatCurrency(netFinPeriod)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
