'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionContext';
import { redirect } from 'next/navigation';
import PermissionsMatrix from '@/components/settings/permissions/PermissionsMatrix';
import { Role, AppPermission } from '@/components/settings/roles/RolesList';

export default function PermissionsClient() {
  const { hasPermission: originalHasPermission, loading: permissionsLoading } = usePermissions();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Real permission check — no bypass
  const hasPermission = (module: string, resource: string, action?: string) => {
    if (!action) {
      if (module === 'SETTINGS' && resource === 'READ') return originalHasPermission('roles', 'role', 'read');
      return false;
    }
    return originalHasPermission(module, resource, action);
  };

  useEffect(() => {
    if (!permissionsLoading) {
      const authorized = originalHasPermission('roles', 'role', 'read');
      if (!authorized) {
        redirect('/dashboard');
      }
    }
  }, [permissionsLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiFetch('/api/settings/roles'),
        apiFetch('/api/permissions')
      ]);
      setRoles(rolesResponse || []);
      setPermissions(permissionsResponse || []);
    } catch (error) {
      console.error('Failed to load matrix data:', error);
      toast.error('Erreur lors du chargement de la matrice de droits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('SETTINGS', 'READ')) {
      loadData();
    }
  }, [permissionsLoading]);

  const handleTogglePermission = async (roleId: string, permissionId: string, checked: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    let newPermissionIds = role.permissions.map(rp => rp.permissionId);
    if (checked) {
      newPermissionIds.push(permissionId);
    } else {
      newPermissionIds = newPermissionIds.filter(id => id !== permissionId);
    }

    try {
      await apiFetch(`/api/settings/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds: newPermissionIds })
      });
      toast.success('Droits d\'accès synchronisés');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la synchronisation des droits');
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-950 tracking-tighter flex items-center gap-3">
          <Shield className="text-blue-600" size={32} />
          Permissions d'Accès
        </h1>
        <p className="text-slate-500 font-medium mt-1">Vue matricielle globale des habilitations affectées à chaque profil.</p>
      </div>

      {/* Matrix Table */}
      <PermissionsMatrix
        roles={roles}
        permissions={permissions}
        onTogglePermission={handleTogglePermission}
      />
    </div>
  );
}
