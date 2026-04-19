import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`
                bg-white border border-gray-100 rounded-[2.5rem] shadow-sm 
                transition-all duration-300
                ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-8 border-b border-gray-50 ${className}`}>
        {children}
    </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <h3 className={`text-xl font-black text-gray-900 tracking-tight uppercase ${className}`}>
        {children}
    </h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-8 ${className}`}>
        {children}
    </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-8 border-t border-gray-50 bg-gray-50/50 rounded-b-[2.5rem] ${className}`}>
        {children}
    </div>
);

