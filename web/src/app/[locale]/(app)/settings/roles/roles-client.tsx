'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionContext';
import { useRouter } from '@/navigation';
import { redirect } from 'next/navigation';
import RolesList, { Role, AppPermission } from '@/components/settings/roles/RolesList';
import RoleDetail from '@/components/settings/roles/RoleDetail';
import CreateRoleModal from '@/components/settings/roles/CreateRoleModal';

export default function RolesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get('selected');

  const { hasPermission: originalHasPermission, loading: permissionsLoading, invalidateAndRefresh } = usePermissions();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<AppPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      const isDev = process.env.NODE_ENV === 'development';
      const authorized = isDev || originalHasPermission('roles', 'role', 'read');
      if (!authorized) {
        redirect('/dashboard');
      }
    }
  }, [permissionsLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        apiFetch('/api/settings/roles'),
        apiFetch('/api/permissions')
      ]);
      setRoles(rolesData || []);
      setAllPermissions(permissionsData || []);
      
      // Handle initial selection
      if (rolesData && rolesData.length > 0) {
        if (selectedParam && rolesData.some((r: Role) => r.id === selectedParam)) {
          setSelectedRoleId(selectedParam);
        } else {
          setSelectedRoleId(rolesData[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load roles data:', error);
      toast.error('Erreur lors du chargement des profils d\'accès');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('SETTINGS', 'READ')) {
      loadData();
    }
  }, [permissionsLoading]);

  // Sync selected role selection on param change
  useEffect(() => {
    if (selectedParam && roles.some(r => r.id === selectedParam)) {
      setSelectedRoleId(selectedParam);
    }
  }, [selectedParam, roles]);

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    router.replace(`/settings/roles?selected=${roleId}` as any);
  };

  const handleSavePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      await apiFetch(`/api/settings/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds })
      });
      toast.success('Permissions enregistrées — droits synchronisés en temps réel');
      // Refresh the JWT so updated permissions take effect immediately without re-login
      await invalidateAndRefresh();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
      throw error;
    }
  };

  const handleCreateRole = async (roleData: { name: string; displayName: string; description: string; permissionIds: string[] }) => {
    try {
      const newRole = await apiFetch('/api/settings/roles', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });
      toast.success('Rôle créé avec succès');
      await loadData();
      if (newRole && newRole.id) {
        handleSelectRole(newRole.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du rôle');
      throw error;
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId) || null;

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
          Rôles & Permissions
        </h1>
        <p className="text-slate-500 font-medium mt-1">Configurez les profils d'habilitations et affectez les droits aux modules.</p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side List */}
        <div className="lg:col-span-1">
          <RolesList
            roles={roles}
            selectedRoleId={selectedRoleId}
            onSelect={handleSelectRole}
            onCreateClick={() => setIsCreateOpen(true)}
          />
        </div>

        {/* Right Side Detail */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <RoleDetail
              role={selectedRole}
              allPermissions={allPermissions}
              onSave={handleSavePermissions}
            />
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-12 text-center text-slate-400 font-bold text-sm min-h-[500px] flex items-center justify-center">
              Sélectionnez un rôle pour voir ses permissions
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreateOpen && (
        <CreateRoleModal
          allPermissions={allPermissions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateRole}
        />
      )}
    </div>
  );
}
