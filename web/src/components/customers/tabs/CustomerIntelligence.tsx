'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, MessageSquare, ArrowRight, Package, Clock } from 'lucide-react';
import { customersService } from '@/services/customers';

export function CustomerIntelligence({ customerId }: { customerId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIntel = async () => {
            try {
                const res = await customersService.getIntelligence(customerId);
                setData(res);
            } catch (error) {
                console.error("Failed to load intelligence", error);
            } finally {
                setLoading(false);
            }
        };
        fetchIntel();
    }, [customerId]);

    if (loading) {
        return <div className="h-48 flex items-center justify-center animate-pulse text-slate-400">Analyse de l'intelligence client en cours...</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* AI Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 flex gap-4 items-start shadow-sm">
                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                    <Brain size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-indigo-950 mb-2 flex items-center gap-2">
                        Synthèse IA
                        <Badge variant="default" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">BETA</Badge>
                    </h3>
                    <p className="text-indigo-900/80 leading-relaxed font-medium">
                        {data.summary}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health & Sentiment */}
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                            <TrendingUp size={16} /> Santé Globale
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-slate-600">Score de Santé</span>
                                <span className="text-2xl font-black text-slate-800">{data.healthScore}/100</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${data.healthScore > 80 ? 'bg-green-500' : data.healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${data.healthScore}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-600">Sentiment Récent</span>
                            <Badge variant="success" className="border-green-200 text-green-700 bg-green-50 px-3 py-1">
                                {data.sentiment || 'NEUTRE'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                            <Package size={16} /> Top Produits Achetés
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(data.topProducts || []).length > 0 ? data.topProducts.map((p: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700 truncate mr-2">{p.name}</span>
                                    <span className="font-bold text-primary whitespace-nowrap">{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(p.revenue)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.max(10, (p.revenue / (data.topProducts[0]?.revenue || 1)) * 100)}%` }} />
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-slate-400 text-center py-4">Aucun produit acheté récemment</div>
                        )}
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                            <Clock size={16} /> Dernières Interactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {(data.recentInteractions || []).length > 0 ? data.recentInteractions.map((interaction: any, i: number) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Marker */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-colors duration-300">
                                        <MessageSquare size={14} />
                                    </div>
                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm group-hover:border-primary/20 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{interaction.type}</span>
                                            <span className="text-xs font-bold text-slate-400">{new Date(interaction.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{interaction.subject}</h4>
                                        <p className="text-sm text-slate-500 line-clamp-2">{interaction.content}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-slate-400 text-center py-8">Aucune interaction enregistrée</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
