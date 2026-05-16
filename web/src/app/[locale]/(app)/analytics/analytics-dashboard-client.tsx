'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  ArrowRight,
  Loader2,
  Calendar,
  Filter,
  ShoppingCart,
  Percent,
  CheckCircle2,
  AlertCircle,
  Truck,
  Activity,
  History,
  MousePointer2
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { analyticsService, AnalyticsKPI, ImminentRupture } from '@/services/analytics';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboardClient() {
  const t = useTranslations('analytics');
  const ct = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [kpis, setKpis] = useState<AnalyticsKPI | null>(null);
  const [ruptures, setRuptures] = useState<ImminentRupture[]>([]);
  const [delays, setDelays] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        kpiRes,
        ruptureRes,
        delayRes,
        bottleneckRes,
        revenueRes,
        topProdRes,
        catRes,
        movementRes
      ] = await Promise.all([
        analyticsService.getKPIs(period),
        analyticsService.getImminentRupture(),
        analyticsService.getPaymentDelays(),
        analyticsService.getProductionBottlenecks(),
        analyticsService.getRevenueEvolution(30),
        analyticsService.getTopProducts(5),
        analyticsService.getCategoryDistribution(),
        analyticsService.getRecentTransactions(8)
      ]);

      setKpis(kpiRes);
      setRuptures(ruptureRes);
      setDelays(delayRes);
      setBottlenecks(bottleneckRes);
      setRevenueData(revenueRes);
      setTopProducts(topProdRes);
      setCategoryData(catRes);
      setRecentMovements(movementRes);
    } catch (err) {
      console.error('Failed to load analytics dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Calcul des analyses en cours...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Row 0 - Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Centre d'Analyse <span className="text-blue-600">&</span> Prédictions</h1>
          <p className="text-slate-500 font-medium text-lg">Vision stratégique et pilotage proactif de votre activité.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
            {[
              { id: 'week', label: '7 jours' },
              { id: 'month', label: '30 jours' },
              { id: 'quarter', label: 'Trimestre' },
              { id: 'year', label: 'Année' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1 - KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Chiffre d'Affaires"
          value={formatCurrency(kpis?.revenue || 0)}
          change={kpis?.revenueChange || 0}
          icon={DollarSign}
          variant="blue"
        />
        <KPICard
          title="Marge Brute"
          value={`${kpis?.margin || 0}%`}
          change={2.4}
          icon={Percent}
          variant="emerald"
        />
        <KPICard
          title="Commandes Actives"
          value={kpis?.activeOrders || 0}
          change={-5.1}
          icon={ShoppingCart}
          variant="purple"
        />
        <KPICard
          title="Taux de Rupture"
          value={`${kpis?.stockOutRate.toFixed(1) || 0}%`}
          change={1.2}
          icon={AlertCircle}
          variant="rose"
        />
      </div>

      {/* Row 2 - Predictive Alerts ("Bientôt") */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 ml-2">
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Bientôt (Prédictions)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AlertCard
            title="Rupture Imminente"
            count={ruptures.length}
            items={ruptures.slice(0, 3).map(r => `${r.name} (${r.daysRemaining}j)`)}
            icon={AlertTriangle}
            color="rose"
            cta="Réapprovisionner"
          />
          <AlertCard
            title="Surstock à Risque"
            count={0}
            items={["Aucun surstock critique"]}
            icon={Package}
            color="amber"
            cta="Déstocker"
          />
          <AlertCard
            title="Retards Paiement"
            count={delays.length}
            items={delays.slice(0, 3).map(d => `${d.customer.name} - ${formatCurrency(Number(d.totalAmount))}`)}
            icon={Clock}
            color="orange"
            cta="Relancer"
          />
          <AlertCard
            title="Goulot Production"
            count={bottlenecks.length}
            items={bottlenecks.slice(0, 3).map(b => `${b.moReference}: ${b.componentName}`)}
            icon={FactoryIcon}
            color="blue"
            cta="Gérer"
          />
        </div>
      </div>

      {/* Row 3 - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ChartContainer title="Évolution du CA (30j)" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top 5 Produits" icon={Activity}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} width={100} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="totalRevenue" fill="#2563eb" radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Répartition par Catégorie" icon={Filter}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Row 4 - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TableCard title="Dernières Transactions" icon={History}>
          <div className="flex flex-col gap-4">
            {recentMovements.length > 0 ? recentMovements.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${m.type === 'IN' || m.type === 'MFG_OUTPUT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Activity size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{m.product?.name || 'Produit'}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{m.reference}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-black ${m.type === 'IN' || m.type === 'MFG_OUTPUT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.type === 'IN' || m.type === 'MFG_OUTPUT' ? '+' : '-'}{m.quantity} {m.unit}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center py-10 opacity-40">
                <History size={48} className="mb-2" />
                <p className="text-xs font-black uppercase">Aucune transaction récente</p>
              </div>
            )}
          </div>
        </TableCard>

        <TableCard title="Performance Clients" icon={MousePointer2}>
           {/* Placeholder for now or another table */}
           <div className="flex flex-col items-center py-20 opacity-40">
             <CheckCircle2 size={48} className="mb-4" />
             <p className="text-sm font-black uppercase tracking-widest text-slate-500">Données en cours de traitement</p>
           </div>
        </TableCard>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, icon: Icon, variant }: any) {
  const colors = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    purple: 'bg-purple-600',
    rose: 'bg-rose-600'
  };

  const bgColors = {
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    purple: 'bg-purple-50',
    rose: 'bg-rose-50'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${bgColors[variant as keyof typeof bgColors]} transition-colors group-hover:scale-110`}>
          <Icon className={variant === 'blue' ? 'text-blue-600' : variant === 'emerald' ? 'text-emerald-600' : variant === 'purple' ? 'text-purple-600' : 'text-rose-600'} size={24} />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function AlertCard({ title, count, items, icon: Icon, color, cta }: any) {
  const colorMap = {
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color as keyof typeof colorMap].split(' ')[1]} ${colorMap[color as keyof typeof colorMap].split(' ')[0]}`}>
          <Icon size={20} />
        </div>
        <span className={`text-lg font-black ${colorMap[color as keyof typeof colorMap].split(' ')[0]}`}>{count}</span>
      </div>
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-3">{title}</h3>
      <div className="flex-1 space-y-2 mb-6">
        {items.map((item: string, i: number) => (
          <p key={i} className="text-[11px] font-medium text-slate-500 line-clamp-1 border-l-2 border-slate-100 pl-2">{item}</p>
        ))}
      </div>
      <button className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:bg-slate-50 active:scale-95 ${colorMap[color as keyof typeof colorMap]}`}>
        {cta}
      </button>
    </div>
  );
}

function ChartContainer({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TableCard({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
            <Icon size={18} />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        </div>
        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
          Voir tout <ArrowRight size={12} />
        </button>
      </div>
      {children}
    </div>
  );
}

function FactoryIcon({ size, className }: any) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1" />
      <path d="M12 18h1" />
      <path d="M7 18h1" />
    </svg>
  );
}
