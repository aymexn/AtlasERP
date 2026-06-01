'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, PackageOpen, Award, TrendingUp } from 'lucide-react';
import { customersService } from '@/services/customers';

export function OrdersSales({ customerId }: { customerId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await customersService.getOrdersAnalysis(customerId);
                setData(res);
            } catch (error) {
                console.error("Failed to load orders analysis", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [customerId]);

    if (loading) {
        return <div className="h-48 flex items-center justify-center animate-pulse text-slate-400">Analyse des ventes en cours...</div>;
    }

    if (!data) return null;

    const formatDZD = (value: number) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(value);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Valeur Vie Client (LTV)</p>
                            <Award className="text-indigo-200" size={20} />
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter">{formatDZD(data.lifetimeValue)}</h3>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panier Moyen (AOV)</p>
                            <TrendingUp className="text-primary" size={20} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-800">{formatDZD(data.aov)}</h3>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commandes Totales</p>
                            <ShoppingCart className="text-blue-500" size={20} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-800">{data.totalOrders}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Cours</p>
                            <PackageOpen className="text-amber-500" size={20} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-800">{data.totalOpenOrders}</h3>
                        <p className="text-xs font-bold text-amber-500 mt-1">{formatDZD(data.valueOpenOrders)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/40">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                        <ShoppingCart size={16} /> Historique Récent des Commandes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.recentOrders || []).map((order: any, i: number) => (
                                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 border-b border-slate-50 font-bold text-primary text-sm">{order.reference}</td>
                                        <td className="py-4 border-b border-slate-50 text-slate-500 text-sm">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="py-4 border-b border-slate-50">
                                             <Badge variant="default" className={`text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                                                 ['COMPLETED', 'SHIPPED', 'INVOICED'].includes(order.status) ? 'border-green-200 text-green-700 bg-green-50' : 
                                                 order.status === 'CANCELLED' ? 'border-red-200 text-red-700 bg-red-50' : 
                                                 'border-amber-200 text-amber-700 bg-amber-50'
                                             }`}>
                                                 {order.status}
                                             </Badge>
                                        </td>
                                        <td className="py-4 border-b border-slate-50 text-right font-black text-slate-700 text-sm">{formatDZD(order.totalAmountTtc)}</td>
                                    </tr>
                                ))}
                                {(data.recentOrders || []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-slate-400 font-bold">Aucune commande trouvée.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
