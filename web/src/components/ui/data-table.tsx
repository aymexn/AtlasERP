import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    emptyState?: React.ReactNode;
    isLoading?: boolean;
}

export function DataTable<T>({ data, columns, onRowClick, emptyState, isLoading }: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm animate-pulse">
                <div className="h-16 bg-gray-50/50 border-b border-gray-100" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 border-b border-gray-50 bg-white" />
                ))}
            </div>
        );
    }

    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {columns.map((column, index) => (
                                <th 
                                    key={index}
                                    className={`
                                        px-8 py-5 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-gray-100 whitespace-nowrap
                                        ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                                        ${column.className || ''}
                                    `}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((item, rowIndex) => (
                            <tr 
                                key={rowIndex}
                                onClick={() => onRowClick?.(item)}
                                className={`
                                    group transition-all hover:bg-blue-50/30 cursor-pointer
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                `}
                            >
                                {columns.map((column, colIndex) => {
                                    const content = typeof column.accessor === 'function' 
                                        ? column.accessor(item) 
                                        : (item[column.accessor] as React.ReactNode);
                                    
                                    return (
                                        <td 
                                            key={colIndex}
                                            className={`
                                                px-8 py-6 text-sm font-bold text-gray-700 tracking-tight
                                                ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                                                ${column.className || ''}
                                            `}
                                        >
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

