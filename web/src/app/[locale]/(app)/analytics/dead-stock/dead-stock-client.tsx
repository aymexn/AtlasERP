'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  AlertTriangle, 
  Trash2, 
  Tag, 
  ArrowLeftRight, 
  Clock, 
  Package, 
  Search, 
  Filter,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Calendar,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface DeadStockItem {
  id: string;
  productId: string;
  quantity: number;
  stockValue: number;
  lastSaleDate: string | null;
  daysWithoutSale: number;
  lastPurchaseDate: string | null;
  daysSincePurchase: number;
  category: string;
  reason: string;
  actionRecommended: string;
  actionTaken: string | null;
  product: {
    name: string;
    sku: string;
    standardCost: number;
  };
  warehouse: {
    name: string;
  };
}

interface Summary {
  totalItems: number;
  totalValue: number;
  byCategory: {
    slowMoving: number;
    deadStock: number;
    obsolete: number;
  };
}

export default function DeadStockClient() {
  const t = useTranslations('analytics');
  const [items, setItems] = useState<DeadStockItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const response = await apiFetch(`/analytics/dead-stock${category ? `?category=${category}` : ''}`);
      setItems(response.items || []);
      setSummary(response.summary || null);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiFetch('/analytics/dead-stock/identify', { method: 'POST' });
      toast.success('Analyse du stock mort mise à jour');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = async (itemId: string, action: string) => {
    try {
      await apiFetch(`/analytics/dead-stock/${itemId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      toast.success('Action enregistrée');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'obsolete': return 'bg-rose-500';
      case 'dead_stock': return 'bg-orange-500';
      case 'slow_moving': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'discount': return <Tag size={16} />;
      case 'return_to_supplier': return <ArrowLeftRight size={16} />;
      case 'dispose': return <Trash2 size={16} />;
      default: return <Package size={16} />;
    }
  };

  const categories = [
    { id: 'all', label: 'Tous les articles', count: items.length },
    { id: 'slow_moving', label: 'Rotation Lente', count: summary?.byCategory.slowMoving || 0 },
    { id: 'dead_stock', label: 'Stock Dormant', count: summary?.byCategory.deadStock || 0 },
    { id: 'obsolete', label: 'Obsolète', count: summary?.byCategory.obsolete || 0 },
  ];

  if (loading && items.length === 0) {
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
            <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Analyse Stock Mort</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl">
            Optimisez votre trésorerie en identifiant les actifs dormants. 
            Détectez les produits n'ayant eu aucune vente depuis 90+ jours et prenez des mesures correctives.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-14 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center gap-3 font-black text-sm transition-all shadow-xl shadow-slate-200 uppercase tracking-tighter disabled:opacity-50 group"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          Relancer l'analyse
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Articles</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tighter">{summary?.totalItems || 0}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Éléments analysés</div>
        </div>

        <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur Immobilisée</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tighter">
            {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(summary?.totalValue || 0)}
          </div>
          <div className="text-[10px] font-bold text-rose-500 uppercase mt-1">Trésorerie bloquée</div>
        </div>

        <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Délai Moyen</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tighter">
            {Math.round(items.reduce((acc, i) => acc + i.daysWithoutSale, 0) / (items.length || 1))} Jours
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Sans mouvement de vente</div>
        </div>

        <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions Requises</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tighter">
            {items.filter(i => !i.actionTaken).length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">En attente de décision</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Filtrer par Catégorie</h3>
            </div>
            <div className="p-2 space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                    selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      cat.id === 'all' ? 'bg-blue-400' : getCategoryColor(cat.id)
                    }`}></div>
                    <span className="text-xs font-black uppercase tracking-tight">{cat.label}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    selectedCategory === cat.id ? 'bg-blue-500' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-black text-sm uppercase tracking-tight mb-2">Conseil Expert</h4>
              <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                Pour les articles **Classe C** (ABC) qui se retrouvent en **Stock Mort**, privilégiez la mise au rebut ou le don pour libérer de l'espace physique immédiatement.
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Package size={100} />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher par produit ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-12 pr-4 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Trier par:</span>
                <select className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer">
                  <option>Valeur (Dés.)</option>
                  <option>Jours d'inactivité</option>
                  <option>Quantité</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {items
                .filter(i => i.product.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${getCategoryColor(item.category)}`}>
                        <Package size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-900 tracking-tight">{item.product.name}</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">
                            {item.product.sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Calendar size={12} /> {item.daysWithoutSale} jours sans vente</span>
                          <span className="flex items-center gap-1.5"><ArrowLeftRight size={12} /> {item.warehouse.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Financier</div>
                        <div className="text-lg font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(Number(item.stockValue))}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 italic">Qté: {Number(item.quantity)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.actionTaken ? (
                          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-xs font-black uppercase">
                            <CheckCircle2 size={14} />
                            {item.actionTaken}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleAction(item.id, 'discount')}
                              className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:border-blue-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all"
                              title="Appliquer remise"
                            >
                              <Tag size={18} />
                            </button>
                            <button 
                              onClick={() => handleAction(item.id, 'return_to_supplier')}
                              className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:border-amber-600 hover:text-amber-600 rounded-xl flex items-center justify-center transition-all"
                              title="Retour fournisseur"
                            >
                              <ArrowLeftRight size={18} />
                            </button>
                            <button 
                              onClick={() => handleAction(item.id, 'dispose')}
                              className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:border-rose-600 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all"
                              title="Mise au rebut"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                        <button className="w-10 h-10 text-slate-300 hover:text-slate-600 transition-colors flex items-center justify-center">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Aucun stock mort détecté</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">
                  Félicitations ! Votre inventaire semble sain avec une rotation régulière sur l'ensemble de vos références.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
