'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    ArrowLeft, Download, Building2, Ban, CheckCircle2,
    Brain, Wallet, ShoppingCart, Users
} from 'lucide-react';
import { customersService, Customer } from '@/services/customers';
import { toast } from 'sonner';
import { useRouter } from '@/navigation';
import { Badge } from '@/components/ui/badge';
import { downloadPdf } from '@/lib/download-pdf';

// Import Tabs
import { CustomerIntelligence } from '@/components/customers/tabs/CustomerIntelligence';
import { FinancesPayments } from '@/components/customers/tabs/FinancesPayments';
import { OrdersSales } from '@/components/customers/tabs/OrdersSales';
import { ContactsCommunication } from '@/components/customers/tabs/ContactsCommunication';

export default function CustomerDashboardClient({ customerId }: { customerId: string }) {
    const t = useTranslations('sales');
    const ct = useTranslations('common');
    const router = useRouter();
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'intelligence' | 'finances' | 'orders' | 'contacts'>('intelligence');

    useEffect(() => {
        loadData();
    }, [customerId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await customersService.getOne(customerId);
            setCustomer(data);
        } catch (err) {
            toast.error(ct('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async () => {
        if (!customer) return;
        if (!confirm(customer.isBlocked ? 'Débloquer ce client ?' : 'Bloquer ce client ?')) return;
        try {
            await customersService.toggleBlock(customerId);
            toast.success('Statut du client mis à jour');
            loadData();
        } catch (err) {
            toast.error(ct('toast.error'));
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

    if (!customer) return null;

    const getSegmentColor = (segment?: string) => {
        switch (segment) {
            case 'A': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'B': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'C': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-slate-50 text-slate-400';
        }
    };

    const tabs = [
        { id: 'intelligence', label: 'Intelligence Client', icon: Brain },
        { id: 'finances', label: 'Finances & Paiements', icon: Wallet },
        { id: 'orders', label: 'Commandes & Ventes', icon: ShoppingCart },
        { id: 'contacts', label: 'Contacts & CRM', icon: Users },
    ] as const;

    return (
        <div className="flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Block Banner */}
            {customer.isBlocked && (
                <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-red-500/20">
                    <Ban size={20} />
                    Attention : Ce client est actuellement bloqué. La création de nouvelles commandes pourrait être restreinte.
                </div>
            )}

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
                            <h1 className={`text-3xl font-black text-slate-800 tracking-tighter ${customer.isBlocked ? 'line-through text-slate-500' : ''}`}>{customer.name}</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSegmentColor(customer.segment)}`}>
                                Segment {customer.segment || 'C'}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                customer.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                                customer.riskLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-green-100 text-green-700 border-green-200'
                            }`}>
                                {customer.riskLevel || 'LOW'} RISK
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <Building2 size={12} />
                            {customer.customerType || 'Retailer'} • {customer.email || 'Pas de courriel'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleToggleBlock}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                            customer.isBlocked ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                    >
                        {customer.isBlocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                        {customer.isBlocked ? 'Débloquer' : 'Bloquer'}
                    </button>
                    <button 
                        onClick={() => downloadPdf(`/api/pdf/customer-dossier/${customerId}`, `Fiche_${customer.name}.pdf`)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} />
                        Dossier
                    </button>
                </div>
            </div>

            {/* Custom Tab Navigation */}
            <div className="flex space-x-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-white text-primary shadow-sm border border-slate-200' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
                {activeTab === 'intelligence' && <CustomerIntelligence customerId={customerId} />}
                {activeTab === 'finances' && <FinancesPayments customerId={customerId} />}
                {activeTab === 'orders' && <OrdersSales customerId={customerId} />}
                {activeTab === 'contacts' && <ContactsCommunication customerId={customerId} />}
            </div>
        </div>
    );
}
