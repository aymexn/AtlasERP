import React from 'react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
    type?: 'count' | 'currency';
    subtitle?: string;
}


const variantStyles: Record<string, string> = {
    primary: 'border-blue-100/50',
    success: 'border-blue-100/50',
    warning: 'border-amber-100/50',
    danger: 'border-red-100/50',
    info: 'border-sky-100/50',
    secondary: 'border-gray-100/50'
};

const iconStyles: Record<string, string> = {
    primary: 'bg-[#2563eb]/10 text-[#2563eb]',
    success: 'bg-[#2563eb]/10 text-emerald-600',
    warning: 'bg-[#2563eb]/10 text-amber-600',
    danger: 'bg-[#2563eb]/10 text-red-600',
    info: 'bg-[#2563eb]/10 text-[#2563eb]',
    secondary: 'bg-[#2563eb]/10 text-gray-600'
};

export const KpiCard: React.FC<KpiCardProps> = ({ 
    title, 
    value, 
    icon: Icon, 
    variant = 'secondary', 
    trend,
    type = 'currency',
    subtitle
}) => {

    const formattedValue = type === 'count' 
        ? formatNumber(value) 
        : formatCurrency(value);

    return (
        <div className={`
            group relative bg-white p-8 rounded-[24px] border-2 transition-all duration-500
            hover:shadow-2xl hover:shadow-[#2563eb]/5 hover:-translate-y-1
            min-w-[240px]
            ${variantStyles[variant] || variantStyles.secondary}
        `}>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transition-colors group-hover:text-slate-600">
                        {title}
                    </h3>
                    <div className={`p-3 rounded-xl transition-all duration-500 group-hover:scale-110 ${iconStyles[variant] || iconStyles.secondary}`}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="text-gray-900 tracking-tighter leading-none" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.75rem)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}>
                        {formattedValue}
                    </div>
                    {subtitle && (
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {subtitle}
                        </div>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mt-2 ${trend.isPositive ? 'text-primary' : 'text-red-500'}`}>
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-current opacity-10">
                                {trend.isPositive ? '↑' : '↓'}
                            </span>
                            {trend.value}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

