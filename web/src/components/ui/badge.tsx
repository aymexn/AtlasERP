import React from 'react';

type BadgeVariant = 
    | 'draft' 
    | 'confirmed' 
    | 'received' 
    | 'cancelled' 
    | 'validated' 
    | 'in_progress' 
    | 'completed' 
    | 'planned' 
    | 'active' 
    | 'inactive'
    | 'warning'
    | 'danger'
    | 'info'
    | 'primary'
    | 'default';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
    received: 'bg-blue-50/50 text-blue-700 border-blue-100/50',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
    validated: 'bg-blue-600/10 text-primary border-primary/10',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    completed: 'bg-blue-50/50 text-blue-700 border-blue-100/50',
    planned: 'bg-purple-50 text-purple-700 border-purple-100',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive: 'bg-gray-50 text-gray-500 border-gray-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    info: 'bg-sky-50 text-sky-700 border-sky-100',
    primary: 'bg-blue-50 text-primary border-primary/10',
    default: 'bg-gray-50 text-gray-600 border-gray-100'
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
    return (
        <span className={`
            px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border
            ${variantStyles[variant] || variantStyles.default}
            ${className}
        `}>
            {children}
        </span>
    );
};

