'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { History, Search, Clock, User, Shield, RefreshCw } from 'lucide-react';

export default function AuditPage() {
    const t = useTranslations('admin.audit');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async (query = '') => {
        try {
            setLoading(true);
            const data = await apiFetch(`/api/activities?q=${encodeURIComponent(query)}`);
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to load audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadLogs(searchTerm);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
                        <Shield className="text-blue-600" size={32} />
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>

                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <Search className="absolute left-4 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm w-64 shadow-sm"
                        />
                    </form>
                    
                    <button
                        onClick={() => { setSearchTerm(''); loadLogs(''); }}
                        disabled={loading}
                        className="h-11 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-sm uppercase"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualiser
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-4xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Activities</span>
                    </div>
                </div>

                <DataTable
                    data={logs}
                    isLoading={loading}
                    columns={[
                        {
                            header: t('table.date'),
                            accessor: (l) => (
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="font-medium text-slate-600">{new Date(l.createdAt).toLocaleString()}</span>
                                </div>
                            )
                        },
                        {
                            header: t('table.user'),
                            accessor: (l) => (
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-gray-400" />
                                    <span className="font-bold text-blue-600">{l.user?.email || 'Système'}</span>
                                </div>
                            )
                        },
                        {
                            header: t('table.action'),
                            accessor: (l) => (
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                                    l.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    l.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                    'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                    {l.action}
                                </span>
                            )
                        },
                        {
                            header: t('table.module'),
                            accessor: (l) => (
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">{l.entity}</span>
                                </div>
                            )
                        },
                        {
                            header: t('table.details'),
                            accessor: (l) => (
                                <div className="max-w-[400px] truncate text-[11px] text-slate-600 font-semibold">
                                    {l.description || (l.newValues ? JSON.stringify(l.newValues) : '---')}
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}

