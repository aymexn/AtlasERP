'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Zap, 
  Play, 
  Settings, 
  Activity, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Clock, 
  Plus,
  RefreshCw,
  Gauge,
  Coins
} from 'lucide-react';
import { aiService, AiAutomation } from '@/services/ai';
import GlassCard from '@/components/ai/GlassCard';

export default function AiAutomationsClient() {
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<any[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await aiService.getAutomations();
      setAutomations(res || []);
    } catch (error) {
      console.error('Failed to load AI automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await aiService.toggleAutomation(id);
      setAutomations(prev => prev.map(item => item.id === id ? updated : item));
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronisation des règles d'automatisation...</p>
      </div>
    );
  }

  // Calculate aggregated stats
  const activeCount = automations.filter(a => a.isActive).length;
  const totalExecutions = automations.reduce((sum, a) => sum + (a.stats?.executionCount || 0), 0);
  const totalRecovered = automations.reduce((sum, a) => sum + (a.stats?.recoveredAmount || 0), 0);

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={14} className="text-purple-600 animate-pulse" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Contrôle des pipelines de fond</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Flux Automatisés <span className="text-purple-600">AI</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Activez des agents autonomes pour accomplir les tâches chronophages.</p>
        </div>
        
        <button 
          onClick={loadData}
          className="p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agents Actifs</span>
            <Zap className="text-purple-500 animate-pulse" size={16} />
          </div>
          <p className="text-3xl font-black text-slate-850 dark:text-white mt-4">{activeCount} / {automations.length}</p>
          <p className="text-xs text-slate-400 mt-1">Exécution continue en arrière-plan</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tâches Exécutées</span>
            <Gauge className="text-pink-500" size={16} />
          </div>
          <p className="text-3xl font-black text-slate-850 dark:text-white mt-4">{totalExecutions}</p>
          <p className="text-xs text-slate-400 mt-1">Opérations complétées par l'IA</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur Récupérée</span>
            <Coins className="text-cyan-500" size={16} />
          </div>
          <p className="text-3xl font-black text-slate-850 dark:text-white mt-4">
            {totalRecovered > 0 ? `${totalRecovered.toLocaleString('fr-FR')} DA` : 'Calcul...'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Estimations financières des relances</p>
        </GlassCard>
      </div>

      {/* Automations List */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Pipelines Disponibles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {automations.map((auto) => (
            <GlassCard key={auto.id} className="p-8 flex flex-col justify-between hover:border-purple-500/30">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{auto.name}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type: {auto.type}</span>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    onClick={() => handleToggle(auto.id)}
                    disabled={togglingId === auto.id}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      auto.isActive ? 'bg-purple-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        auto.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {auto.description}
                </p>

                {/* Configuration conditions detail */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Déclencheur : </span>
                  {auto.type === 'stock_reorder' 
                    ? 'Quantité de Stock <= Point de Commande' 
                    : auto.type === 'payment_reminder' 
                    ? 'Facture non payée depuis > 15 jours' 
                    : 'Confiance de Cross-sell >= 75%'}
                </div>
              </div>

              {/* Stats / Info Footer */}
              <div className="mt-8 pt-4 border-t border-purple-500/5 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                <span>Dernière exécution: {auto.lastRun ? new Date(auto.lastRun).toLocaleDateString() : 'En attente'}</span>
                <span className="text-purple-600">Exécuté {auto.stats?.executionCount || 0} fois</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
}
