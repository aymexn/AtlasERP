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
    enableSelection?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    getRowId?: (item: T) => string;
}

export function DataTable<T>({ 
    data, 
    columns, 
    onRowClick, 
    emptyState, 
    isLoading,
    enableSelection = false,
    selectedIds = [],
    onSelectionChange,
    getRowId = (item: any) => item.id
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm animate-pulse">
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

    const allIds = data.map(item => getRowId(item));
    const isAllSelected = data.length > 0 && selectedIds.length === data.length;

    const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange?.(allIds);
        } else {
            onSelectionChange?.([]);
        }
    };

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger onRowClick
        if (selectedIds.includes(id)) {
            onSelectionChange?.(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange?.([...selectedIds, id]);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {enableSelection && (
                                <th className="pl-8 pr-4 py-5 w-10 border-b border-gray-100">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                        checked={isAllSelected}
                                        onChange={toggleAll}
                                    />
                                </th>
                            )}
                            {columns.map((column, index) => (
                                <th 
                                    key={index}
                                    className={`
                                        ${enableSelection && index === 0 ? 'pl-4' : 'px-8'} py-5 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-gray-100 whitespace-nowrap
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
                        {data.map((item, rowIndex) => {
                            const itemId = getRowId(item);
                            const isSelected = selectedIds.includes(itemId);

                            return (
                                <tr 
                                    key={rowIndex}
                                    onClick={() => onRowClick?.(item)}
                                    className={`
                                        group transition-all hover:bg-blue-50/30 cursor-pointer
                                        ${isSelected ? 'bg-blue-50/20' : ''}
                                    `}
                                >
                                    {enableSelection && (
                                        <td className="pl-8 pr-4 py-6 w-10">
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                checked={isSelected}
                                                onChange={() => {}} // Controlled by toggleRow click on td
                                                onClick={(e) => toggleRow(itemId, e)}
                                            />
                                        </td>
                                    )}
                                    {columns.map((column, colIndex) => {
                                        const content = typeof column.accessor === 'function' 
                                            ? column.accessor(item) 
                                            : (item[column.accessor] as React.ReactNode);
                                        
                                        return (
                                            <td 
                                                key={colIndex}
                                                className={`
                                                    ${enableSelection && colIndex === 0 ? 'pl-4' : 'px-8'} py-6 text-sm font-bold text-gray-700 tracking-tight
                                                    ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                                                    ${column.className || ''}
                                                `}
                                            >
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

