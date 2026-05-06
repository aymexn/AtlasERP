'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  PieChart as PieIcon, 
  BarChart as BarIcon, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface AbcSummary {
  classification: string;
  product_count: number;
  total_revenue: number;
  avg_turnover_rate: number;
  avg_revenue_percentage: number;
}

interface AbcProduct {
  id: string;
  classification: string;
  annualRevenue: number;
  revenuePercentage: number;
  stockTurnoverRate: number;
  daysInStock: number;
  product: {
    name: string;
    sku: string;
    family?: { name: string };
  };
}

export default function ABCClient() {
  const t = useTranslations('analytics');
  const [summary, setSummary] = useState<AbcSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('A');
  const [products, setProducts] = useState<AbcProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadProducts(selectedClass);
    }
  }, [selectedClass]);

  const loadData = async () => {
    setLoading(true);
    try {
      const summaryData = await apiFetch('/analytics/abc/summary');
      setSummary(summaryData || []);
    } catch (error) {
      console.error('Failed to load ABC summary:', error);
      toast.error('Erreur lors du chargement de l\'analyse ABC');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (classification: string) => {
    try {
      const productsData = await apiFetch(`/analytics/abc/products/${classification}`);
      setProducts(productsData || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      await apiFetch('/analytics/abc/calculate', {
        method: 'POST',
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
      });
      toast.success('Classification ABC mise à jour');
      loadData();
    } catch (error) {
      toast.error('Erreur lors du calcul');
    } finally {
      setCalculating(false);
    }
  };

  const COLORS = {
    A: '#3b82f6', // Blue
    B: '#8b5cf6', // Purple
    C: '#ec4899'  // Pink
  };

  const chartData = summary.map(s => ({
    name: `Classe ${s.classification}`,
    value: Number(s.total_revenue),
    count: Number(s.product_count),
    color: COLORS[s.classification as keyof typeof COLORS] || '#94a3b8'
  }));

  if (loading && summary.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <PieIcon size={22} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Classification ABC</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl">
            Optimisez votre inventaire en priorisant les produits à forte valeur ajoutée (80/20). 
            Identifiez vos moteurs de revenus et gérez efficacement les articles à faible rotation.
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="h-14 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center gap-3 font-black text-sm transition-all shadow-xl shadow-slate-200 uppercase tracking-tighter disabled:opacity-50 group"
        >
          {calculating ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          )}
          Mettre à jour l'analyse
        </button>
      </div>

      {/* Summary Cards & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {['A', 'B', 'C'].map((cls) => {
            const data = summary.find(s => s.classification === cls);
            const color = COLORS[cls as keyof typeof COLORS];
            const descriptions = {
              A: 'Produits critiques (80% du CA)',
              B: 'Produits importants (15% du CA)',
              C: 'Produits mineurs (5% du CA)'
            };
            
            return (
              <div 
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`p-6 bg-white border-2 rounded-[2rem] transition-all cursor-pointer group ${
                  selectedClass === cls ? 'border-blue-600 shadow-xl shadow-blue-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${
                    selectedClass === cls ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                  }`}>
                    {cls}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenus</div>
                    <div className="text-lg font-black text-slate-900 tracking-tighter">
                      {data ? new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(Number(data.total_revenue)) : '0 DZD'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">{descriptions[cls as keyof typeof descriptions]}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{data?.product_count || 0} Articles</span>
                    <span className="text-[10px] font-black text-slate-900">{data ? Number(data.avg_revenue_percentage).toFixed(1) : 0}% du CA</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${data ? data.avg_revenue_percentage : 0}%`,
                        backgroundColor: color
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-8 bg-white border-2 border-slate-100 rounded-[3rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <BarIcon size={20} className="text-blue-600" />
              Répartition des Revenus
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Classe A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Classe B</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Classe C</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
                          <p className="font-black text-slate-900 text-xs uppercase mb-2">{data.name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-8">
                              <span className="text-[10px] font-bold text-slate-400">CA Total</span>
                              <span className="text-[10px] font-black text-slate-900">{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(data.value)}</span>
                            </div>
                            <div className="flex justify-between gap-8">
                              <span className="text-[10px] font-bold text-slate-400">Articles</span>
                              <span className="text-[10px] font-black text-slate-900">{data.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${
              selectedClass === 'A' ? 'bg-blue-600 shadow-blue-100' : 
              selectedClass === 'B' ? 'bg-purple-500 shadow-purple-100' : 
              'bg-pink-500 shadow-pink-100'
            }`}>
              {selectedClass}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Articles Classe {selectedClass}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualisation détaillée des performances par produit</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrer ces articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 h-12 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenu Annuel</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">% CA</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Rotation</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Jours en Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products
                .filter(p => p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                        <Target size={18} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight">{item.product.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{item.product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="font-black text-slate-900 text-sm tracking-tighter">
                      {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(Number(item.annualRevenue))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 group-hover:bg-white transition-colors">
                      {Number(item.revenuePercentage).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm">
                        {Number(item.stockTurnoverRate).toFixed(1)}x
                        {Number(item.stockTurnoverRate) > 10 ? (
                          <TrendingUp size={14} className="text-emerald-500" />
                        ) : Number(item.stockTurnoverRate) < 2 ? (
                          <TrendingDown size={14} className="text-rose-500" />
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className={`text-sm font-bold ${
                      Number(item.daysInStock) > 120 ? 'text-rose-500' : 
                      Number(item.daysInStock) < 30 ? 'text-emerald-500' : 
                      'text-slate-600'
                    }`}>
                      {Math.round(Number(item.daysInStock))} Jours
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {products.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <Search size={32} />
            </div>
            <p className="font-black text-slate-900 uppercase tracking-tighter">Aucun produit trouvé</p>
            <p className="text-slate-400 text-sm font-medium">Lancez une analyse ou changez de catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}
