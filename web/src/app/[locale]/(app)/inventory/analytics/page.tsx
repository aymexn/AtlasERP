'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/navigation';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Package,
    Coins,
    Activity,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Calendar,
    ArrowLeft,
    Layers,
    ShoppingCart,
    Clock,
    Percent,
    Warehouse,
    Filter
} from 'lucide-react';
import {
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
import { formatPrice, formatStock, formatNumber } from '@/lib/format';

interface KPIResponse {
    totalValue: number;
    stockTurnover: number;
    daysOfStock: number;
    alertCount: number;
    stockOutRate: number;
    deadStockCount: number;
    deadStockValue: number;
}

interface StockEvolutionItem {
    mois: string;
    valeur: number;
}

interface MonthlyMovementItem {
    mois: string;
    entrees: number;
    sorties: number;
}

interface TopProductItem {
    name: string;
    sku: string;
    valeur_stock: number;
    type: string;
}

interface FamilyDistributionItem {
    name: string;
    color_badge: string;
    valeur: number;
}

interface TopProductsResponse {
    topProducts: TopProductItem[];
    familyDistribution: FamilyDistributionItem[];
}

interface AlertItem {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    reorderPoint: number;
    lack: number;
    unit: string;
    supplierName: string;
}

const FAMILY_COLORS: Record<string, string> = {
    blue: '#2563eb',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    purple: '#9333ea',
    pink: '#db2777',
    red: '#dc2626',
    orange: '#ea580c',
    amber: '#d97706',
    yellow: '#ca8a04',
    green: '#16a34a',
    emerald: '#059669',
    teal: '#0d9488',
    cyan: '#0891b2',
    sky: '#0284c7',
    slate: '#475569',
    gray: '#4b5563',
    zinc: '#52525b',
    neutral: '#525252',
    stone: '#57534e'
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

export default function StockAnalyticsPage() {
    const t = useTranslations('inventory');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KPIResponse | null>(null);
    const [evolution, setEvolution] = useState<StockEvolutionItem[]>([]);
    const [movements, setMovements] = useState<MonthlyMovementItem[]>([]);
    const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
    const [familyDist, setFamilyDist] = useState<FamilyDistributionItem[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [kpisRes, evolutionRes, movementsRes, topProductsRes, alertsRes] = await Promise.all([
                    fetch('/api/inventory/analytics/kpis').then(r => r.json()),
                    fetch('/api/inventory/analytics/stock-evolution').then(r => r.json()),
                    fetch('/api/inventory/analytics/movements-by-month').then(r => r.json()),
                    fetch('/api/inventory/analytics/top-products').then(r => r.json()),
                    fetch('/api/inventory/analytics/alerts').then(r => r.json())
                ]);

                setKpis(kpisRes);
                setEvolution(evolutionRes);
                setMovements(movementsRes);
                setTopProducts(topProductsRes.topProducts || []);
                setFamilyDist(topProductsRes.familyDistribution || []);
                setAlerts(alertsRes);
            } catch (err) {
                console.error('Failed to load stock analytics:', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Formatting Y-Axis ticks nicely (e.g. 1 500 000 -> "1.5 M", 150 000 -> "150 k")
    const formatYAxis = (tick: number) => {
        if (tick >= 1000000) {
            return `${(tick / 1000000).toFixed(1).replace('.', ',')}\u00a0M`;
        }
        if (tick >= 1000) {
            return `${(tick / 1000).toFixed(0)}\u00a0k`;
        }
        return tick.toString();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} strokeWidth={2.5} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
                    Calcul des indicateurs de stock en cours...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/inventory')}
                        className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm group"
                        title="Retour à la gestion des stocks"
                    >
                        <ArrowLeft size={20} className="text-slate-650 transition-transform group-hover:-translate-x-1" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            Analytique Stock
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">
                            Rotation, couverture, alertes et tendances de valorisation
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {/* VALEUR TOTALE */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
                            <Coins size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Valeur Stock</p>
                        <p className="text-xl font-black text-slate-900 mt-1 whitespace-nowrap truncate max-w-full font-mono tabular-nums" title={formatPrice(kpis?.totalValue)}>
                            {formatPrice(kpis?.totalValue)}
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">En DZD, toutes références</p>
                </div>

                {/* ROTATION (Turnover) */}
                {(() => {
                    const value = kpis?.stockTurnover ?? 0;
                    const colorClass = value > 3 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                       value >= 1 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                       'text-rose-600 bg-rose-50 border-rose-100';
                    const iconColor = value > 3 ? 'text-emerald-600' : value >= 1 ? 'text-amber-600' : 'text-rose-600';
                    return (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                            <div>
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border ${colorClass}`}>
                                    <Activity size={20} strokeWidth={2.5} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rotation du Stock</p>
                                <p className={`text-2xl font-black mt-1 ${iconColor}`}>{value}&times;</p>
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">Calculé sur 7 mois (Annalisé)</p>
                        </div>
                    );
                })()}

                {/* COUVERTURE (Days of Stock) */}
                {(() => {
                    const days = kpis?.daysOfStock ?? 0;
                    const isOptimal = days >= 30 && days <= 90;
                    const colorClass = isOptimal ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100';
                    const textColor = isOptimal ? 'text-emerald-600' : 'text-amber-600';
                    return (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                            <div>
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border ${colorClass}`}>
                                    <Clock size={20} strokeWidth={2.5} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Couverture</p>
                                <p className={`text-2xl font-black mt-1 ${textColor}`}>{days} jours</p>
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">À cadence de vente actuelle</p>
                        </div>
                    );
                })()}

                {/* ARTICLES EN ALERTE */}
                {(() => {
                    const count = kpis?.alertCount ?? 0;
                    const colorClass = count > 0 ? 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse' : 'text-slate-600 bg-slate-50 border-slate-100';
                    const textColor = count > 0 ? 'text-rose-600' : 'text-slate-650';
                    return (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                            <div>
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border ${colorClass}`}>
                                    <AlertCircle size={20} strokeWidth={2.5} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Articles en Alerte</p>
                                <p className={`text-2xl font-black mt-1 ${textColor}`}>{count}</p>
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">Sous le seuil d'alerte min</p>
                        </div>
                    );
                })()}

                {/* TAUX DE RUPTURE */}
                {(() => {
                    const rate = kpis?.stockOutRate ?? 0;
                    const isHigh = rate > 5.0;
                    const colorClass = isHigh ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-600 bg-slate-50 border-slate-100';
                    const textColor = isHigh ? 'text-rose-600' : 'text-slate-650';
                    return (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                            <div>
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 border ${colorClass}`}>
                                    <Package size={20} strokeWidth={2.5} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Taux de Rupture</p>
                                <p className={`text-2xl font-black mt-1 ${textColor}`}>{rate}%</p>
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">Rupture / Total références</p>
                        </div>
                    );
                })()}

                {/* STOCK MORT */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mb-4 border border-slate-150">
                            <Layers size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stock Mort</p>
                        <p className="text-xl font-black text-slate-900 mt-1 whitespace-nowrap truncate max-w-full font-mono tabular-nums" title={formatPrice(kpis?.deadStockValue)}>
                            {formatPrice(kpis?.deadStockValue)}
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">
                        {kpis?.deadStockCount} réf. sans flux &gt; 90j
                    </p>
                </div>
            </div>

            {/* Graphs Layer 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* EVOLUTION STOCK */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-slate-50 text-blue-600 rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Évolution de la Valeur du Stock</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Données mensuelles reconstituées</p>
                        </div>
                    </div>
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={evolution} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="stockValGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <Tooltip
                                    formatter={(value: any) => [formatPrice(value as number), 'Valeur Stock']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 'black', color: '#64748b', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="valeur" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#stockValGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* IN vs OUT MOVEMENTS */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-slate-50 text-blue-600 rounded-xl">
                            <Activity size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Entrées vs Sorties par Mois</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Valeurs cumulées des flux en DZD</p>
                        </div>
                    </div>
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={movements} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <Tooltip
                                    formatter={(value: any, name: any) => [formatPrice(value as number), name === 'entrees' ? 'Entrées' : 'Sorties']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 'black', color: '#64748b', textTransform: 'uppercase' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '10px' }} />
                                <Bar dataKey="entrees" name="entrees" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={16} />
                                <Bar dataKey="sorties" name="sorties" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Graphs Layer 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* TOP 10 ITEMS */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-slate-50 text-blue-600 rounded-xl">
                            <Layers size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Top 10 Articles — Valeur en Stock</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Articles actifs avec la plus haute valorisation</p>
                        </div>
                    </div>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} width={140} />
                                <Tooltip
                                    formatter={(value: any) => [formatPrice(value as number), 'Valeur']}
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="valeur_stock" radius={[0, 8, 8, 0]} barSize={18}>
                                    {topProducts.map((entry, index) => {
                                        let barColor = '#3b82f6'; // PF (blue)
                                        if (entry.type === 'MP') barColor = '#94a3b8'; // MP (slate/gray)
                                        else if (entry.type === 'SF') barColor = '#f97316'; // SF (orange)
                                        
                                        return <Cell key={`cell-${index}`} fill={barColor} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-6 mt-6 justify-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded bg-blue-500" />
                            <span>Produit Fini (PF)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded bg-orange-500" />
                            <span>Semi-Fini (SF)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded bg-slate-400" />
                            <span>Matière Première (MP)</span>
                        </div>
                    </div>
                </div>

                {/* DISTRIBUTION BY FAMILY */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-slate-50 text-blue-600 rounded-xl">
                            <Filter size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Répartition par Famille</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Valorisation cumulée par catégorie</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[250px]">
                        {familyDist.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={familyDist}
                                        innerRadius={60}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="valeur"
                                    >
                                        {familyDist.map((entry, index) => {
                                            const colorKey = entry.color_badge?.toLowerCase() || 'blue';
                                            const fill = FAMILY_COLORS[colorKey] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                            return <Cell key={`cell-${index}`} fill={fill} />;
                                        })}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => [formatPrice(value as number), 'Valeur']} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center opacity-40 py-10">
                                <Package size={48} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-xs font-black uppercase">Aucune famille trouvée</p>
                            </div>
                        )}
                    </div>
                    {/* Legend with Color badges */}
                    <div className="max-h-[140px] overflow-y-auto space-y-2.5 mt-4 pr-1">
                        {familyDist.map((item, idx) => {
                            const colorKey = item.color_badge?.toLowerCase() || 'blue';
                            const fill = FAMILY_COLORS[colorKey] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                            return (
                                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
                                        <span className="truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                    </div>
                                    <span className="font-mono text-slate-900 font-black tabular-nums">{formatPrice(item.valeur)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table Layer — REORDER WIDGET */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Articles à Réapprovisionner</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                            Alerte de niveau critique — Actions prioritaires
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                        <AlertCircle size={22} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="p-1">
                    {alerts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Stock Actuel</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Seuil Alerte</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Manque</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournisseur</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-450 group-hover:rotate-12 transition-transform duration-500">
                                                        <Package size={16} />
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-mono text-xs font-black text-slate-450 uppercase tracking-wider">{item.sku}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                                                {formatStock(item.stockQuantity, item.unit)}
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-400 text-sm whitespace-nowrap">
                                                {formatStock(item.reorderPoint, item.unit)}
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                                                -{formatStock(item.lack, item.unit)}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-slate-650 font-medium text-sm">{item.supplierName}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <Link
                                                    href={`/purchases/orders/new?productId=${item.id}` as any}
                                                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                                >
                                                    <ShoppingCart size={13} strokeWidth={2.5} />
                                                    Commander
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center border border-emerald-100 shadow-sm">
                                <CheckCircle2 size={40} strokeWidth={2.5} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                ✓ Tous les stocks sont OK
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
