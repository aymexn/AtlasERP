import React from 'react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value?: number | string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'slate';
    type?: 'count' | 'currency';
    subtitle?: string;
    loading?: boolean;
}

const config = {
    variantStyles: {
        primary: "bg-blue-50 text-blue-600 border-blue-100",
        success: "bg-emerald-50 text-emerald-600 border-emerald-100",
        warning: "bg-amber-50 text-amber-600 border-amber-100",
        danger: "bg-rose-50 text-rose-600 border-rose-100",
        info: "bg-indigo-50 text-indigo-600 border-indigo-100",
        slate: "bg-slate-50 text-slate-600 border-slate-100"
    }
};

export const KpiCard: React.FC<KpiCardProps> = ({ 
    title, 
    value, 
    icon: Icon, 
    variant = 'primary', 
    type = 'currency', 
    subtitle,
    trend,
    loading = false
}) => {
    
    // Skeleton Loader
    if (loading || value === undefined) {
        return (
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-start gap-5 animate-pulse">
                <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 shrink-0" />
                <div className="space-y-3 flex-1">
                    <div className="h-2 w-20 bg-slate-100 rounded" />
                    <div className="h-6 w-32 bg-slate-50 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex items-start gap-5 group relative overflow-hidden">
            {/* Subtle Icon Container */}
            <div className={`
                h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 border
                ${config.variantStyles[variant] || config.variantStyles.primary}
            `}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
            
            {/* Content Container */}
            <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                    {title}
                </div>
                <div className="mt-2.5 flex items-baseline gap-2 flex-nowrap whitespace-nowrap overflow-hidden">
                    <h3 className={`font-black text-slate-900 tracking-tighter leading-none flex items-baseline flex-nowrap whitespace-nowrap transition-all duration-300 ${
                        (value?.toString() || '').length > 10 ? 'text-lg' : 
                        (value?.toString() || '').length > 8 ? 'text-xl' : 'text-2xl'
                    }`} suppressHydrationWarning>
                        {type === 'currency' ? (
                            <>
                                <span>{formatCurrency(value).replace(' DA', '')}</span>
                                <span className="text-[11px] font-black text-slate-400 ml-1 tracking-widest opacity-60">DA</span>
                            </>
                        ) : formatNumber(value)}
                    </h3>
                    {trend && (
                        <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trend.isPositive ? '↑' : '↓'}{trend.value}%
                        </div>
                    )}
                </div>
                {subtitle && (
                    <div className="text-[10px] font-medium text-slate-400 mt-2 line-clamp-1 italic">
                        {subtitle}
                    </div>
                )}
            </div>

            {/* Micro Decorative Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50/50 blur-2xl rounded-full -mr-8 -mt-8" />
        </div>
    );
};
