'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Sparkles, 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  CheckSquare, 
  Zap, 
  ArrowRight, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck,
  Cpu,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { aiService, AiInsight, AiAutomation } from '@/services/ai';
import GlassCard from '@/components/ai/GlassCard';
import { formatCurrency } from '@/lib/formatters';

export default function AiDashboardClient() {
  const t = useTranslations('nav');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [automations, setAutomations] = useState<AiAutomation[]>([]);
  const [chatPrompt, setChatPrompt] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [insightsRes, automationsRes] = await Promise.all([
        aiService.getInsights(),
        aiService.getAutomations()
      ]);
      setInsights(insightsRes || []);
      setAutomations(automationsRes || []);
    } catch (error) {
      console.error('Error loading AI dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;
    router.push(`/ai/chat?prompt=${encodeURIComponent(chatPrompt)}` as any);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Initialisation du noyau d'intelligence...</p>
      </div>
    );
  }

  // Calculate active automations count
  const activeAutomations = automations.filter(a => a.isActive).length;
  // Dynamic business health score based on active alerts and automations
  const criticalAlerts = insights.filter(i => i.priority === 'critical').length;
  const healthScore = Math.max(50, 95 - (criticalAlerts * 10) + (activeAutomations * 3));

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-8 md:p-10 shadow-[0_0_50px_rgba(139,92,246,0.3)] border border-purple-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(236,72,153,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.15),transparent)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-black uppercase tracking-wider">
              <Sparkles size={12} className="animate-pulse" /> Core AI Engine v2.0
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Atlas <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">Intelligence AI</span>
            </h1>
            <p className="text-slate-300 font-medium text-lg">
              Optimisation proactive de votre ERP. L'IA analyse en continu vos stocks, finances et opérations pour propulser votre entreprise.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={loadDashboardData}
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white transition-all active:scale-95 shadow-md"
              title="Rafraîchir les prédictions"
            >
              <RefreshCw size={20} />
            </button>
            <Link 
              href="/ai/chat"
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
            >
              <MessageSquare size={16} /> Parler à l'Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Health Score and Quick Ask */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* IA Business Health Score Card */}
        <GlassCard className="p-8 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/30 animate-[spin_40s_linear_infinite]" />
            {/* Health circle */}
            <div className="h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tighter">
                {healthScore}%
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Santé Business</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Score d'Efficacité IA</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
            Votre niveau d'optimisation est excellent. {criticalAlerts > 0 ? `Attention, ${criticalAlerts} alerte(s) critique(s) impacte(nt) votre score.` : 'Tous vos signaux d\'activité sont au vert.'}
          </p>
          <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-purple-500/10">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-bold uppercase">Automations</p>
              <p className="text-lg font-black text-purple-600">{activeAutomations}/{automations.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-bold uppercase">Alertes</p>
              <p className="text-lg font-black text-pink-600">{criticalAlerts}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-bold uppercase">Score</p>
              <p className="text-lg font-black text-cyan-600">A+</p>
            </div>
          </div>
        </GlassCard>

        {/* Quick AI Query Card */}
        <GlassCard className="p-8 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl border border-purple-500/20">
                <Cpu size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Poser une question à l'IA</h3>
                <p className="text-sm text-slate-500">Demandez des états financiers, des résumés de stock ou des suggestions d'achat.</p>
              </div>
            </div>

            <form onSubmit={handleQuickChatSubmit} className="relative mt-4">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ex: Quel est mon produit le plus rentable ? Comment optimiser ma trésorerie ?"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-purple-500/50 rounded-2xl py-4 pl-5 pr-14 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all text-slate-800 dark:text-slate-200"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
              >
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Questions suggérées :</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Top clients ce mois-ci",
                "Quels produits réapprovisionner ?",
                "Situation de la trésorerie"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatPrompt(q)}
                  className="px-4 py-2 text-xs font-semibold bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/20 rounded-xl text-purple-700 dark:text-purple-300 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Navigation Shortcuts & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Assistant AI", desc: "Chat intelligent", href: "/ai/chat", icon: MessageSquare, color: "from-purple-500 to-indigo-500" },
          { title: "Insights & Prévisions", desc: "Tendances de ventes", href: "/ai/insights", icon: Eye, color: "from-pink-500 to-rose-500" },
          { title: "Recommandations", desc: "Décisions guidées", href: "/ai/recommendations", icon: CheckSquare, color: "from-amber-500 to-orange-500" },
          { title: "Automatisations", desc: "Flux intelligents", href: "/ai/automations", icon: Zap, color: "from-cyan-500 to-teal-500" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} href={item.href as any} className="group">
              <GlassCard className="p-6 h-full flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-md group-hover:scale-110 transition-all duration-300`}>
                    <Icon size={20} />
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide group-hover:text-purple-600 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* Dynamic Insights Alert Banner */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Insights Clés Détectés</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.slice(0, 3).map((insight) => {
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
                  <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight">{insight.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">{insight.description}</p>
                </div>
                
                {insight.impactValue > 0 && (
                  <div className="flex justify-between items-center pt-4 border-t border-purple-500/5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Impact Estimé</span>
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
