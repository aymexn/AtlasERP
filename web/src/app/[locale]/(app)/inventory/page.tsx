'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { ClipboardList, PackageSearch, ArrowRightLeft, History } from 'lucide-react';

export default function InventoryRootPage() {
    const t = useTranslations('inventory');
    const ct = useTranslations('common');

    const cards = [
        {
            title: t('stock_status'),
            description: t('stock_status_desc'),
            href: '/inventory/products-stock',
            icon: ClipboardList,
            color: 'blue'
        },
        {
            title: t('movements.title'),
            description: t('movements_desc'),
            href: '/inventory/movements',
            icon: History,
            color: 'emerald'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">
                    Atlas<span className="text-blue-600">Inventory</span>
                </h1>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href as any}
                            className="group relative p-8 bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-500 overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-50 rounded-bl-[100%] transition-all group-hover:bg-${card.color}-100 opacity-50`}></div>
                            
                            <div className="relative z-10 space-y-4">
                                <div className={`h-16 w-16 bg-${card.color}-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-${card.color}-200 transition-transform group-hover:scale-110 duration-500`}>
                                    <Icon size={32} />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{card.title}</h3>
                                    <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-[240px]">{card.description}</p>
                                </div>

                                <div className="pt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600">
                                    {ct('consult')}
                                    <ArrowRightLeft size={14} className="transition-transform group-hover:translate-x-2 duration-300" />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Empty stats/placeholder below */}
            <div className="p-12 border-2 border-dashed border-gray-100 rounded-[4rem] text-center space-y-4">
                <div className="mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                    <PackageSearch size={40} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-gray-300 uppercase tracking-widest">{t('analytics_overview')}</h4>
                    <p className="text-xs text-gray-400 font-medium italic">{t('analytics_coming_soon')}</p>
                </div>
            </div>
        </div>
    );
}

