'use client';

import React from 'react';
import { Trash2, Download, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';

interface BulkActionToolbarProps {
    selectedCount: number;
    onDelete?: () => void;
    onExport?: () => void;
    onStatusChange?: (status: string) => void;
    availableStatuses?: { label: string; value: string }[];
}

export function BulkActionToolbar({ 
    selectedCount, 
    onDelete, 
    onExport, 
    onStatusChange,
    availableStatuses = []
}: BulkActionToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-slate-900 text-white rounded-[2rem] px-8 py-4 shadow-2xl flex items-center gap-8 border border-slate-800 backdrop-blur-md bg-opacity-95">
                <div className="flex items-center gap-3 pr-8 border-r border-slate-800">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black">
                        {selectedCount}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Items Sélectionnés
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {onExport && (
                        <button 
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white"
                        >
                            <Download size={14} />
                            Exporter
                        </button>
                    )}

                    {onStatusChange && availableStatuses.length > 0 && (
                        <div className="group relative">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white">
                                <CheckCircle size={14} />
                                Changer État
                            </button>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 rounded-2xl p-2 min-w-[150px] shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                                {availableStatuses.map(status => (
                                    <button
                                        key={status.value}
                                        onClick={() => onStatusChange(status.value)}
                                        className="w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {onDelete && (
                        <button 
                            onClick={onDelete}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                            <Trash2 size={14} />
                            Supprimer
                        </button>
                    )}
                </div>

                <button 
                    onClick={onDelete /* This should be clear selection but I'll use a specific one if needed */}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all ml-4"
                    title="Annuler"
                >
                    <XCircle size={18} />
                </button>
            </div>
        </div>
    );
}
