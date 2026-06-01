'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Eye, 
  Loader2, 
  DollarSign, 
  Activity, 
  Percent, 
  RefreshCw,
  Info,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { aiService, AiInsight, AiPredictionData } from '@/services/ai';
import GlassCard from '@/components/ai/GlassCard';
import { formatCurrency } from '@/lib/formatters';

export default function AiInsightsClient() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'PENDING_DATA'>('SUCCESS');
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [predictionSeries, setPredictionSeries] = useState<AiPredictionData[]>([]);
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insightsRes, predictionsRes] = await Promise.all([
        aiService.getInsights(),
        aiService.getPredictions()
      ]);
      setInsights(insightsRes || []);
      if (predictionsRes && predictionsRes.status === 'PENDING_DATA') {
        setStatus('PENDING_DATA');
      } else if (predictionsRes) {
        setStatus('SUCCESS');
        setPredictionSeries(predictionsRes.series || []);
        setKpis(predictionsRes.kpis || null);
      }
    } catch (error) {
      console.error('Failed to load AI insights data:', error);
      setStatus('PENDING_DATA');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Chargement des modèles prédictifs...</p>
      </div>
    );
  }

  if (status === 'PENDING_DATA') {
    return (
      <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Noyau de calcul prédictif</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Insights <span className="text-purple-600">&</span> Prédictions
            </h1>
            <p className="text-slate-500 font-medium text-lg">Projections intelligentes de trésorerie et de demande.</p>
          </div>
          
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-5 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl text-purple-700 dark:text-purple-300 font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Rafraîchir les calculs
          </button>
        </div>

        <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-16 w-16 bg-purple-500/10 text-purple-600 rounded-3xl flex items-center justify-center mb-6 animate-pulse border border-purple-500/20">
            <Database size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-2">Modèle en cours d'apprentissage</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
            Données insuffisantes pour projeter vos chiffres de ventes (minimum 5 commandes requis).
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Noyau de calcul prédictif</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Insights <span className="text-purple-600">&</span> Prédictions
          </h1>
          <p className="text-slate-500 font-medium text-lg">Projections intelligentes de trésorerie et de demande.</p>
        </div>
        
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-5 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl text-purple-700 dark:text-purple-300 font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> Rafraîchir les calculs
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="CA Prévu (30 jours)"
            value={formatCurrency(kpis.predictedRevenue)}
            badge={`Confiance: ${kpis.confidenceScore}%`}
            icon={DollarSign}
            variant="purple"
          />
          <KPICard
            title="Encaissement Prévu"
            value={formatCurrency(kpis.predictedCashFlow)}
            badge="Basé sur factures"
            icon={TrendingUp}
            variant="cyan"
          />
          <KPICard
            title="Ajustements de Stock"
            value={kpis.optimalStockAdjustmentsCount}
            badge="Recommandé"
            icon={Activity}
            variant="pink"
          />
          <KPICard
            title="Indice de Fiabilité"
            value={`${kpis.confidenceScore}%`}
            badge="Modèle validé"
            icon={Percent}
            variant="emerald"
          />
        </div>
      )}

      {/* Forecast Area Chart */}
      <GlassCard className="p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Prévision de Chiffre d'Affaires Hebdomadaire</h3>
            <p className="text-xs text-slate-400 mt-1">Comparaison entre les ventes réelles et la prédiction de l'IA (période de 6 semaines)</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-purple-600" />
              <span className="font-bold text-slate-500">Ventes Réelles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-pink-500 border border-dashed border-pink-500" />
              <span className="font-bold text-slate-500">Prévision IA</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictionSeries} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: '1px solid rgba(139,92,246,0.1)', 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' 
                }}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                name="Ventes Réelles" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorActual)" 
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                name="Prévision IA" 
                stroke="#ec4899" 
                strokeWidth={3} 
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#colorPred)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Detailed Insights List */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Insights & Recommandations d'Action</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight) => {
            const isAlert = insight.type === 'alert' || insight.priority === 'critical';
            return (
              <GlassCard key={insight.id} className="p-6 flex flex-col justify-between hover:border-purple-500/30">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      isAlert ? 'bg-pink-500/10 text-pink-600' : 'bg-purple-500/10 text-purple-600'
                    }`}>
                      {insight.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Score: {insight.confidenceScore}%</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight">{insight.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{insight.description}</p>
                </div>
                
                {insight.impactValue > 0 && (
                  <div className="flex justify-between items-center pt-4 border-t border-purple-500/5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Impact Financier</span>
                    <span className={`text-sm font-black ${isAlert ? 'text-pink-600' : 'text-purple-600'}`}>
                      {formatCurrency(insight.impactValue)}
                    </span>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, badge, icon: Icon, variant }: any) {
  const bgColors = {
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400',
    pink: 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${bgColors[variant as keyof typeof bgColors]} transition-colors group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
          <Info size={8} /> {badge}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
