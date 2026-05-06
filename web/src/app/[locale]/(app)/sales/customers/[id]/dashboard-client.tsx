'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
    TrendingUp, DollarSign, Clock, AlertTriangle, Package, 
    FileText, ShoppingBag, ArrowLeft, Download, Edit2, 
    ChevronRight, ExternalLink, Calendar, Building2, User,
    Mail, Phone, MapPin, CreditCard, Shield, BadgeCheck,
    BarChart3, PieChart, Activity, CheckCircle2, History
} from 'lucide-react';
import { customersService, CustomerPerformance } from '@/services/customers';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { Link, useRouter } from '@/navigation';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { downloadPdf } from '@/lib/download-pdf';

export default function CustomerDashboardClient({ customerId }: { customerId: string }) {
    const t = useTranslations('sales');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    
    const [performance, setPerformance] = useState<CustomerPerformance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPerformance();
    }, [customerId]);

    const loadPerformance = async () => {
        try {
            setLoading(true);
            const data = await customersService.getPerformance(customerId);
            setPerformance(data);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    if (!performance) return null;

    const { customer, kpis, trend, topProducts, openOrders, unpaidInvoices } = performance;

    const getSegmentColor = (segment?: string) => {
        switch (segment) {
            case 'A': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'B': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'C': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-slate-50 text-slate-400';
        }
    };

    const getBehaviorColor = (behavior?: string) => {
        switch (behavior) {
            case 'EXCELLENT': return 'text-green-600 bg-green-50';
            case 'GOOD': return 'text-blue-600 bg-blue-50';
            case 'AVERAGE': return 'text-amber-600 bg-amber-50';
            case 'POOR': return 'text-red-600 bg-red-50';
            default: return 'text-slate-400 bg-slate-50';
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{customer.name}</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSegmentColor(kpis.segment)}`}>
                                Segment {kpis.segment || 'C'}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <Building2 size={12} />
                            {customer.customerType || 'Retailer'} • {customer.contact || 'No contact assigned'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => downloadPdf(`/api/pdf/customer-statement/${customerId}`, `Releve_${customer.name}.pdf`)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} />
                        Statement
                    </button>
                    <button 
                        onClick={() => downloadPdf(`/api/pdf/customer-dossier/${customerId}`, `Fiche_${customer.name}.pdf`)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <FileText size={16} />
                        Dossier
                    </button>
                    <button className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                        <Edit2 size={16} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title={t('customers.intelligence.kpi_revenue_all_time')}
                    value={kpis.totalRevenueAllTime}
                    icon={TrendingUp}
                    variant="primary"
                    type="currency"
                />
                <KpiCard 
                    title={t('customers.intelligence.kpi_revenue_this_year')}
                    value={kpis.totalRevenueThisYear}
                    icon={DollarSign}
                    variant="success"
                    type="currency"
                />
                <KpiCard 
                    title={t('customers.intelligence.kpi_outstanding')}
                    value={kpis.outstandingBalance}
                    icon={AlertTriangle}
                    variant="warning"
                    type="currency"
                />
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-linear-to-br from-slate-800 to-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Payment Delay</p>
                            <Clock className="text-slate-500" size={18} />
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h3 className="text-3xl font-black text-white tracking-tighter">{kpis.avgPaymentDelay}</h3>
                            <span className="text-slate-400 font-bold text-sm">days</span>
                        </div>
                        <div className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${getBehaviorColor(kpis.paymentBehavior)}`}>
                            {kpis.paymentBehavior || 'GOOD'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 overflow-hidden">
                    <CardHeader className="border-b border-slate-50 p-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="text-primary" size={18} />
                                Revenue Performance (12 Months)
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                        tickFormatter={(val) => `${val/1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => [formatCurrency(val || 0), 'Revenue']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#2563eb" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader className="border-b border-slate-50 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Package className="text-amber-500" size={18} />
                            Top Purchased Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {topProducts.map((p, i) => (
                                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{p.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.sku}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900">{p.qty} units</p>
                                        <p className="text-[9px] font-bold text-primary">{formatCurrency(p.revenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Open Orders */}
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader className="border-b border-slate-50 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <ShoppingBag className="text-blue-500" size={18} />
                            Open Sales Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {openOrders.length > 0 ? openOrders.map((o) => (
                                <Link key={o.id} href={{ pathname: '/sales/orders/[id]', params: { id: o.id } }} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{o.reference}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(o.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900">{formatCurrency(o.totalAmountTtc)}</p>
                                            <Badge variant="warning">{o.status}</Badge>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-all" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="p-10 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active orders</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Unpaid Invoices */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40">
                    <CardHeader className="border-b border-slate-50 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <FileText className="text-red-500" size={18} />
                            Unpaid & Partial Invoices
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total TTC</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-right text-red-600">Remaining</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {unpaidInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-900">{inv.reference}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatCurrency(inv.totalAmountTtc)}</td>
                                            <td className="px-6 py-4 text-xs font-black text-red-600 text-right">{formatCurrency(inv.amountRemaining)}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={inv.status === 'PARTIAL' ? 'warning' : 'danger'}>{inv.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={{ pathname: '/invoices' }} className="p-2 text-slate-300 hover:text-primary transition-all inline-block">
                                                    <ExternalLink size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
