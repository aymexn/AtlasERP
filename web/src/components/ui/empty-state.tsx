import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    title, 
    description, 
    icon: Icon, 
    action 
}) => {
    return (
        <div className="bg-white border border-gray-100 rounded-[3rem] p-20 shadow-sm flex flex-col items-center justify-center text-center group transition-all hover:border-blue-100">
            <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={40} strokeWidth={2} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                {title}
            </h2>
            
            <p className="text-gray-400 max-w-sm mb-10 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                {description}
            </p>

            {action && (
                <button 
                    onClick={action.onClick}
                    className="px-8 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-gray-200 hover:bg-blue-600 hover:shadow-blue-100 transition-all active:scale-95"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

