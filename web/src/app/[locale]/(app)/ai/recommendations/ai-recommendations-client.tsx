'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Coins
} from 'lucide-react';
import { aiService, AiRecommendation } from '@/services/ai';
import GlassCard from '@/components/ai/GlassCard';

export default function AiRecommendationsClient() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await aiService.getRecommendations();
      setRecommendations(res || []);
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = (id: string) => {
    setExecutingId(id);
    // Simulate action execution with a timeout
    setTimeout(() => {
      setExecutingId(null);
      setExecutedIds(prev => [...prev, id]);
    }, 1500);
  };

  const filteredRecs = recommendations.filter(rec => {
    if (filter === 'all') return true;
    return rec.priority === filter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Génération des recommandations décisionnelles...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={14} className="text-purple-600 animate-pulse" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Moteur décisionnel heuristique</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Recommandations <span className="text-purple-600">Smart</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Actions recommandées par l'IA pour augmenter vos performances.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
            title="Recalculer"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-md self-start">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'critical', label: 'Critique' },
          { id: 'high', label: 'Haute' },
          { id: 'medium', label: 'Moyenne' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
              filter === tab.id 
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRecs.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle2 size={48} className="text-purple-500 mb-4 animate-pulse" />
            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Aucune recommandation active</p>
            <p className="text-xs text-slate-400 mt-2">Votre entreprise tourne de manière totalement optimisée d'après l'IA.</p>
          </GlassCard>
        ) : (
          filteredRecs.map((rec) => {
            const isExecuted = executedIds.includes(rec.id);
            const isExecuting = executingId === rec.id;
            const isCritical = rec.priority === 'critical';

            return (
              <GlassCard key={rec.id} className={`p-8 transition-all ${isExecuted ? 'opacity-65' : ''}`}>
                <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
                  
                  {/* Content Info */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        isCritical 
                          ? 'bg-pink-500/10 text-pink-600' 
                          : rec.priority === 'high' 
                          ? 'bg-amber-500/10 text-amber-600' 
                          : 'bg-purple-500/10 text-purple-600'
                      }`}>
                        Priorité {rec.priority}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Coins size={12} /> Impact : <span className={isCritical ? 'text-pink-600' : 'text-purple-600'}>{rec.impact}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{rec.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{rec.subtitle}</p>
                    </div>

                    {/* Analysis Steps */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyse IA :</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {rec.analysis.map((step: string, idx: number) => (
                          <li key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rec.aiSummary && (
                      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 mt-4">
                        <p className="text-xs font-black text-purple-800 dark:text-purple-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                          🤖 Analyse IA (Groq) :
                        </p>
                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 leading-relaxed">{rec.aiSummary}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendation action box */}
                  <div className="w-full lg:w-80 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between self-stretch">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recommandation</h4>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                        {rec.recommendedAction}
                      </p>
                    </div>

                    {isExecuted ? (
                      <div className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Exécuté avec succès
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExecuteAction(rec.id)}
                        disabled={isExecuting}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                          isCritical
                            ? 'bg-pink-600 hover:bg-pink-700 text-white border-pink-600 shadow-md shadow-pink-500/10'
                            : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md shadow-purple-500/10'
                        }`}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="animate-spin" size={14} /> Traitement...
                          </>
                        ) : (
                          <>
                            {rec.actionLabel} <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              </GlassCard>
            )
          })
        )}
      </div>
    </div>
  );
}
