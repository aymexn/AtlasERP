'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Award, 
  Sparkles, 
  ArrowRight,
  Info,
  Calendar,
  Layers,
  Filter,
  Loader2,
  Database
} from 'lucide-react';
import GlassCard from '@/components/ai/GlassCard';
import { aiService } from '@/services/ai';

export default function AiAnalyticsClient() {
  const [activeTab, setActiveTab] = useState<'rfm' | 'basket' | 'retention'>('rfm');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'PENDING_DATA'>('SUCCESS');
  const [rfmSegments, setRfmSegments] = useState<any[]>([]);
  const [basketAssociations, setBasketAssociations] = useState<any[]>([]);
  const [cohortData, setCohortData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await aiService.getAnalytics();
      if (res && res.status === 'PENDING_DATA') {
        setStatus('PENDING_DATA');
      } else {
        setStatus('SUCCESS');
        setRfmSegments(res.rfmList || []);
        setBasketAssociations(res.basketAssociations || []);
        setCohortData(res.cohortList || []);
      }
    } catch (error) {
      console.error('Failed to load AI analytics:', error);
      setStatus('PENDING_DATA');
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (value: number | null) => {
    if (value === null) return 'bg-transparent text-transparent';
    if (value === 100) return 'bg-purple-600 text-white';
    if (value >= 70) return 'bg-purple-500/80 text-white';
    if (value >= 50) return 'bg-purple-500/50 text-slate-800 dark:text-purple-100';
    if (value >= 30) return 'bg-purple-500/20 text-slate-600 dark:text-purple-300';
    return 'bg-purple-500/10 text-slate-400';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Extraction et minage des données en cours...</p>
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
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Algorithmes de minage de données</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytique <span className="text-purple-600">Avancée</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Analyses de segmentation, comportements de panier et cohortes.</p>
        </div>
      </div>

      {status === 'PENDING_DATA' ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-16 w-16 bg-purple-500/10 text-purple-600 rounded-3xl flex items-center justify-center mb-6 animate-pulse border border-purple-500/20">
            <Database size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-2">Modèle en cours d'apprentissage</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
            Données insuffisantes pour segmenter votre portefeuille client (minimum 5 commandes requis).
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Tabs Menu */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-lg self-start">
            {[
              { id: 'rfm', label: 'Segmentation RFM', icon: Users },
              { id: 'basket', label: 'Règles d\'Association', icon: ShoppingBag },
              { id: 'retention', label: 'Rétention Cohortes', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Dynamic Tab Content */}
          <div className="grid grid-cols-1 gap-8">
            
            {/* RFM Segmentation Content */}
            {activeTab === 'rfm' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rfmListEmpty(rfmSegments) ? (
                  <GlassCard className="p-12 text-center col-span-2">
                    <p className="text-sm font-black text-slate-500 uppercase">Aucun client segmenté pour le moment.</p>
                  </GlassCard>
                ) : (
                  rfmSegments.map((segment, idx) => (
                    <GlassCard key={idx} className="p-8 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{segment.name}</h3>
                          <span className={`text-xs font-black px-3 py-1.5 rounded-full ${segment.color}`}>
                            {segment.count} Clients
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {segment.desc}
                        </p>
                        
                        {/* Sample Clients List */}
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exemples de clients :</h4>
                          <div className="flex flex-wrap gap-2">
                            {segment.clients.length === 0 ? (
                              <span className="text-xs italic text-slate-400">Aucun client</span>
                            ) : (
                              segment.clients.map((c: string, cidx: number) => (
                                <span key={cidx} className="px-3 py-1 bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {c}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t border-purple-500/5 flex justify-end">
                        <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                          Cibler ce segment <ArrowRight size={12} />
                        </button>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            )}

            {/* Market Basket Analysis Content */}
            {activeTab === 'basket' && (
              <GlassCard className="p-8">
                <div className="space-y-2 mb-8">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Règles d'association détectées</h3>
                  <p className="text-xs text-slate-400">Analyse croisée des paniers d'achat historiques pour identifier les produits fréquemment achetés ensemble.</p>
                </div>

                {basketAssociations.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-bold uppercase">
                    Données d'achats groupés insuffisantes pour trouver des associations
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-4">Produits d'Origine (Si A)</th>
                          <th className="py-4">Produit Suggéré (Alors B)</th>
                          <th className="py-4 text-center">Score Confiance</th>
                          <th className="py-4 text-center">Fréquence (Support)</th>
                          <th className="py-4 text-center">Indice d'Attraction (Lift)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-850 font-semibold text-slate-750 dark:text-slate-300">
                        {basketAssociations.map((assoc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="py-4 font-bold text-slate-900 dark:text-white">{assoc.antecedents.join(', ')}</td>
                            <td className="py-4 text-purple-600 dark:text-purple-400 font-bold">{assoc.consequents.join(', ')}</td>
                            <td className="py-4 text-center">
                              <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                                {assoc.confidence}%
                              </span>
                            </td>
                            <td className="py-4 text-center">{assoc.support}% des paniers</td>
                            <td className="py-4 text-center text-cyan-600 font-black">+{assoc.lift}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Cohort Retention Content */}
            {activeTab === 'retention' && (
              <GlassCard className="p-8">
                <div className="space-y-2 mb-8">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Rétention Client (Cohortes Mensuelles)</h3>
                  <p className="text-xs text-slate-400">Pourcentage des clients recrutés lors d'un mois spécifique ayant effectué une nouvelle commande les mois suivants.</p>
                </div>

                {cohortData.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-bold uppercase">
                    Données d'achats chronologiques insuffisantes pour dresser les cohortes
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-4 text-left">Mois de Recrutement</th>
                          <th className="py-4">Taille Cohorte</th>
                          <th className="py-4">Mois 0</th>
                          <th className="py-4">Mois 1</th>
                          <th className="py-4">Mois 2</th>
                          <th className="py-4">Mois 3</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-slate-750 dark:text-slate-350">
                        {cohortData.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-50 dark:border-slate-850">
                            <td className="py-4 text-left font-bold text-slate-900 dark:text-white">{row.cohort}</td>
                            <td className="py-4 text-slate-500">{row.size} clients</td>
                            <td className="py-4"><div className={`py-2 rounded-xl mx-1 ${getHeatmapColor(row.m0)}`}>{row.m0 ? `${row.m0}%` : '-'}</div></td>
                            <td className="py-4"><div className={`py-2 rounded-xl mx-1 ${getHeatmapColor(row.m1)}`}>{row.m1 ? `${row.m1}%` : '-'}</div></td>
                            <td className="py-4"><div className={`py-2 rounded-xl mx-1 ${getHeatmapColor(row.m2)}`}>{row.m2 ? `${row.m2}%` : '-'}</div></td>
                            <td className="py-4"><div className={`py-2 rounded-xl mx-1 ${getHeatmapColor(row.m3)}`}>{row.m3 ? `${row.m3}%` : '-'}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            )}

          </div>
        </>
      )}
    </div>
  );
}

function rfmListEmpty(list: any[]) {
  if (!list || list.length === 0) return true;
  return list.every(item => item.count === 0);
}
