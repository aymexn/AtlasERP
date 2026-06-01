'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, AlertOctagon, TrendingDown, RefreshCcw } from 'lucide-react';
import { customersService } from '@/services/customers';

export function FinancesPayments({ customerId }: { customerId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinances = async () => {
            try {
                const res = await customersService.getFinancialSummary(customerId);
                setData(res);
            } catch (error) {
                console.error("Failed to load financial summary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinances();
    }, [customerId]);

    if (loading) {
        return <div className="h-48 flex items-center justify-center animate-pulse text-slate-400">Analyse financière en cours...</div>;
    }

    if (!data) return null;

    const formatDZD = (value: number) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(value);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Outstanding & Credit Limit */}
                <Card className="col-span-1 md:col-span-2 border-none shadow-xl shadow-slate-200/40 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste à Recouvrer</p>
                                <h3 className="text-4xl font-black tracking-tighter text-red-400">
                                    {formatDZD(data.totalOutstanding)}
                                </h3>
                            </div>
                            <div className="p-3 bg-white/10 rounded-xl">
                                <Wallet className="text-white" size={24} />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-slate-300">
                                <span>Utilisation du Crédit ({data.creditUtilization.toFixed(1)}%)</span>
                                <span>Plafond: {formatDZD(data.creditLimit)}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${data.creditUtilization > 90 ? 'bg-red-500' : data.creditUtilization > 75 ? 'bg-orange-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, data.creditUtilization)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 text-right mt-1">
                                Disponible: {formatDZD(data.availableCredit)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* DSO */}
                <Card className="border-none shadow-xl shadow-slate-200/40 flex flex-col justify-center items-center text-center p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <RefreshCcw size={12} /> DSO Moyen
                    </p>
                    <div className="relative mb-2">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
                            <circle cx="48" cy="48" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" 
                                className={data.dso > 60 ? 'text-red-500' : data.dso > 30 ? 'text-amber-500' : 'text-green-500'}
                                strokeDasharray={226}
                                strokeDashoffset={226 - (226 * Math.min(data.dso, 90)) / 90} 
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-black text-slate-800">{data.dso}</span>
                            <span className="text-[10px] font-black text-slate-400">JRS</span>
                        </div>
                    </div>
                    <Badge variant="default" className="mt-2 border-slate-200 text-slate-600">
                        Comportement: {data.paymentBehavior}
                    </Badge>
                </Card>
            </div>

            {/* Aging Chart */}
            <Card className="border-none shadow-xl shadow-slate-200/40">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                        <AlertOctagon size={16} /> Balance Âgée
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: '0-30 Jours', value: data.aging['0_30'], color: 'bg-green-100 text-green-700 border-green-200' },
                            { label: '31-60 Jours', value: data.aging['31_60'], color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                            { label: '61-90 Jours', value: data.aging['61_90'], color: 'bg-orange-100 text-orange-700 border-orange-200' },
                            { label: '> 90 Jours', value: data.aging['over_90'], color: 'bg-red-100 text-red-700 border-red-200' }
                        ].map((bucket, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${bucket.color} flex flex-col items-center justify-center text-center shadow-sm`}>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{bucket.label}</span>
                                <span className="text-lg font-black">{formatDZD(bucket.value || 0)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Unpaid Invoices */}
            <Card className="border-none shadow-xl shadow-slate-200/40">
                <CardHeader>
                    <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                        <TrendingDown size={16} /> Principales Factures Impayées
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant Initial</th>
                                    <th className="border-b border-slate-100 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reste à Payer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.unpaidInvoices || []).map((inv: any, i: number) => (
                                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 border-b border-slate-50 font-bold text-slate-700 text-sm">{inv.reference}</td>
                                        <td className="py-4 border-b border-slate-50 text-slate-500 text-sm">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="py-4 border-b border-slate-50 text-right font-medium text-slate-600 text-sm">{formatDZD(inv.totalAmountTtc)}</td>
                                        <td className="py-4 border-b border-slate-50 text-right font-black text-red-500 text-sm">{formatDZD(inv.amountRemaining)}</td>
                                    </tr>
                                ))}
                                {(data.unpaidInvoices || []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-slate-400 font-bold">Aucune facture impayée. Client à jour ! 🎉</td>
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
