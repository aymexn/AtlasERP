import React from 'react';
import { X } from 'lucide-react';

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100 flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                onClick={() => onOpenChange(false)}
            />
            
            {/* Sheet wrapper */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { onOpenChange });
                }
                return child;
            })}
        </div>
    );
};

export const SheetContent = ({ 
    children, 
    className = "",
    side = "right",
    onOpenChange
}: { 
    children: React.ReactNode;
    className?: string;
    side?: "left" | "right" | "top" | "bottom";
    onOpenChange?: (open: boolean) => void;
}) => (
    <div className={`
        relative w-full bg-white h-full shadow-2xl flex flex-col
        animate-in slide-in-from-right duration-500 ease-out border-l border-white/10
        ${className}
    `}>
        {onOpenChange && (
            <button 
                onClick={() => onOpenChange(false)}
                className="absolute right-6 top-6 z-50 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
                <X size={20} strokeWidth={3} />
            </button>
        )}
        {children}
    </div>
);

export const SheetHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`flex flex-col space-y-1.5 p-8 bg-[#2563eb] text-white shadow-lg shadow-blue-500/10 ${className}`}>
        {children}
    </div>
);

export const SheetTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <h2 className={`text-2xl font-black tracking-tight leading-none ${className}`}>
        {children}
    </h2>
);

export const SheetDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-70 ${className}`}>
        {children}
    </div>
);

export const SheetFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`mt-auto border-t border-gray-100 p-8 flex items-center justify-between gap-4 bg-gray-50/50 ${className}`}>
        {children}
    </div>
);

