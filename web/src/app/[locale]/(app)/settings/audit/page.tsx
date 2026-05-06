'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { auditService, AuditLog } from '@/services/audit';
import { DataTable } from '@/components/ui/data-table';
import { History, Search, Filter, Clock, User, Shield } from 'lucide-react';

export default function AuditPage() {
    const t = useTranslations('settings');
    const ct = useTranslations('common');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const data = await auditService.list();
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to load audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
                    <Shield className="text-blue-600" size={32} />
                    Journal d'Audit
                </h1>
                <p className="text-muted-foreground font-medium">Suivi complet des modifications et actions utilisateurs pour la conformité.</p>
            </div>

            <div className="bg-white rounded-4xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activités Récentes</span>
                    </div>
                </div>

                <DataTable
                    data={logs}
                    isLoading={loading}
                    columns={[
                        {
                            header: 'Date',
                            accessor: (l) => (
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>{new Date(l.createdAt).toLocaleString()}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Utilisateur',
                            accessor: (l) => (
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-gray-400" />
                                    <span className="font-bold text-blue-600">{l.user?.email || 'Système'}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Action',
                            accessor: (l) => (
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                                    l.action.includes('POST') || l.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    l.action.includes('DELETE') ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                    'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                    {l.action}
                                </span>
                            )
                        },
                        {
                            header: 'Entité',
                            accessor: (l) => (
                                <div className="flex flex-col">
                                    <span className="font-bold">{l.entity}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{l.entityId}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Détails',
                            accessor: (l) => (
                                <div className="max-w-[300px] truncate text-[10px] text-gray-500 font-medium">
                                    {l.newValues ? JSON.stringify(l.newValues) : '---'}
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
