import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    description?: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    subtitle, 
    description, 
    icon: Icon, 
    action,
    actions 
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-5">
                {Icon && (
                    <div className="h-14 w-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
                        <Icon size={28} />
                    </div>
                )}
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
                        {title}
                    </h1>
                    {(subtitle || description) && (
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">
                            {subtitle || description}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {actions}
                {action && (
                    <button
                        onClick={action.onClick}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                        {action.icon && <action.icon size={18} />}
                        {action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

