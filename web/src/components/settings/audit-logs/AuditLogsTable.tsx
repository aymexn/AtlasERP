'use client';

import React, { useState } from 'react';
import { Eye, Clock, User, ArrowRight, X } from 'lucide-react';
import { useRouter } from '@/navigation';

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string | null;
  oldValues: any;
  newValues: any;
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
  } | null;
}

interface AuditLogsTableProps {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export default function AuditLogsTable({
  logs,
  total,
  page,
  limit,
  onPageChange,
  loading
}: AuditLogsTableProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return dateString;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Heure</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Analyse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-450 font-bold text-sm text-slate-400">
                    Aucune activité enregistrée
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                        <Clock size={12} className="text-slate-400" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {log.user ? (
                        <button
                          onClick={() => router.push(`/settings/users?highlight=${log.user?.id}` as any)}
                          className="flex items-center gap-2 group text-left"
                        >
                          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {log.user.email.substring(0, 2)}
                          </div>
                          <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 group-hover:underline transition-all">
                            {log.user.email}
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Système</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-2 py-1.5 rounded-lg border uppercase tracking-widest ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-8 py-5 max-w-xs truncate">
                      <span className="text-xs font-semibold text-slate-500">
                        {log.description || (log.newValues ? JSON.stringify(log.newValues) : '---')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                        title="Comparer les modifications"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400">
            Affichage de {logs.length} sur {total} logs d'activité
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="h-10 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs transition-all"
            >
              Précédent
            </button>
            <span className="h-10 px-4 flex items-center justify-center font-bold text-xs text-slate-700 bg-white border border-slate-200 rounded-xl">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="h-10 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs transition-all"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Difference JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Détails des modifications</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Comparateur de valeurs avant/après</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-100 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Old Values */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Anciennes Valeurs</span>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-[10px] text-slate-600 overflow-x-auto min-h-[150px] max-h-[300px]">
                    {selectedLog.oldValues ? (
                      <pre>{JSON.stringify(selectedLog.oldValues, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-400 italic">Aucune valeur précédente</span>
                    )}
                  </div>
                </div>

                {/* New Values */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nouvelles Valeurs</span>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-[10px] text-slate-600 overflow-x-auto min-h-[150px] max-h-[300px]">
                    {selectedLog.newValues ? (
                      <pre>{JSON.stringify(selectedLog.newValues, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-400 italic">Aucune valeur nouvelle</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 h-12 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
