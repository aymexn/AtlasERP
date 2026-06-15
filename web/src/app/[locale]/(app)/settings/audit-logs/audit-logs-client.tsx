'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { History, Download, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionContext';
import { redirect } from 'next/navigation';
import AuditLogsFilters from '@/components/settings/audit-logs/AuditLogsFilters';
import AuditLogsTable, { AuditLog } from '@/components/settings/audit-logs/AuditLogsTable';
import { User } from '@/components/settings/users/UsersTable';

export default function AuditLogsClient() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId') || '';

  const { hasPermission: originalHasPermission, loading: permissionsLoading } = usePermissions();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    userId: userIdParam,
    action: '',
    module: '',
    from: '',
    to: '',
    q: ''
  });

  // Wrap permission checks to handle 'AUDIT' module references
  const hasPermission = (module: string, resource: string, action?: string) => {
    if (!action) {
      if (module === 'AUDIT' && resource === 'LOG-READ') return originalHasPermission('audit', 'log', 'read');
      return false;
    }
    return originalHasPermission(module, resource, action);
  };

  useEffect(() => {
    if (!permissionsLoading) {
      const authorized = hasPermission('AUDIT', 'LOG-READ');
      if (!authorized) {
        redirect('/dashboard');
      }
    }
  }, [permissionsLoading]);

  // Sync filter if userIdParam changes
  useEffect(() => {
    if (userIdParam) {
      setFilters(prev => ({ ...prev, userId: userIdParam }));
      setPage(1);
    }
  }, [userIdParam]);

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/api/settings/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users for filter:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        userId: filters.userId,
        action: filters.action,
        module: filters.module,
        from: filters.from,
        to: filters.to,
        q: filters.q
      });

      const response = await apiFetch(`/api/settings/audit-logs?${query.toString()}`);
      setLogs(response.logs || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Erreur lors du chargement des logs d\'activité');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('AUDIT', 'LOG-READ')) {
      loadUsers();
    }
  }, [permissionsLoading]);

  useEffect(() => {
    if (!permissionsLoading && hasPermission('AUDIT', 'LOG-READ')) {
      loadLogs();
    }
  }, [permissionsLoading, page, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExportCSV = () => {
    window.location.href = '/api/settings/audit-logs/export';
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter flex items-center gap-3">
            <History className="text-blue-600" size={32} />
            Journal d'Activité
          </h1>
          <p className="text-slate-500 font-medium mt-1">Suivi complet des actions et modifications effectuées sur la plateforme.</p>
        </div>

        {hasPermission('audit', 'log', 'export') && (
          <button
            onClick={handleExportCSV}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-2 font-black text-sm transition-all shadow-lg shadow-blue-100 uppercase tracking-tighter"
          >
            <Download size={18} />
            Exporter CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <AuditLogsFilters
        users={users}
        onFilterChange={handleFilterChange}
      />

      {/* Logs Table */}
      <AuditLogsTable
        logs={logs}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
