'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Eye, Save, Lock } from 'lucide-react';
import PermissionCheckbox from './PermissionCheckbox';
import { Role, AppPermission } from './RolesList';
import { useRouter } from '@/navigation';

interface RoleDetailProps {
  role: Role;
  allPermissions: AppPermission[];
  onSave: (roleId: string, permissionIds: string[]) => Promise<void>;
}

export default function RoleDetail({ role, allPermissions, onSave }: RoleDetailProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSelectedIds(role.permissions.map(p => p.permissionId));
    setSuccess(false);
  }, [role]);

  const handleCheckboxChange = (permissionId: string, checked: boolean) => {
    if (role.isSystemRole) return;
    if (checked) {
      setSelectedIds(prev => [...prev, permissionId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSave = async () => {
    if (role.isSystemRole) return;
    setSaving(true);
    setSuccess(false);
    try {
      await onSave(role.id, selectedIds);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  // Group allPermissions by module
  const groupedPermissions: Record<string, AppPermission[]> = {};
  allPermissions.forEach(p => {
    const key = p.module.toUpperCase();
    if (!groupedPermissions[key]) {
      groupedPermissions[key] = [];
    }
    groupedPermissions[key].push(p);
  });

  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'AUDIT': return 'Audit & Activités';
      case 'CLIENTS': return 'Gestion Clients';
      case 'PRODUCTS': return 'Catalogue Articles';
      case 'STOCK': return 'Stocks & Entrepôts';
      case 'SALES': return 'Ventes & Facturation';
      case 'PURCHASES': return 'Achats & Fournisseurs';
      case 'FINANCE': return 'Trésorerie & Finance';
      case 'HR': return 'Ressources Humaines';
      case 'REPORTS': return 'Analytique & Rapports';
      case 'SETTINGS': return 'Configuration Système';
      case 'USERS': return 'Utilisateurs & Accès';
      case 'ROLES': return 'Rôles & Permissions';
      default: return mod;
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {role.displayName}
            </h1>
            <p className="text-slate-400 text-xs font-bold tracking-tight lowercase mt-0.5">{role.description || 'Rôle de configuration'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role.isSystemRole ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
              <Lock size={12} />
              RÔLE SYSTÈME (LECTURE SEULE)
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 font-black text-xs transition-all uppercase tracking-tighter"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={14} />
                  Sauvegarder
                </>
              )}
            </button>
          )}

          <button
            onClick={() => router.push(`/settings/permissions?role=${role.id}` as any)}
            className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center gap-2 font-black text-xs transition-all uppercase tracking-tighter"
          >
            <Eye size={14} />
            Matrice complète
          </button>
        </div>
      </div>

      {/* Permissions Groups */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-bold animate-in fade-in duration-300">
            Permissions enregistrées avec succès !
          </div>
        )}

        {Object.keys(groupedPermissions).map((moduleKey) => (
          <div key={moduleKey} className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-blue-600">
              {getModuleTitle(moduleKey)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedPermissions[moduleKey].map((permission) => {
                const isChecked = selectedIds.includes(permission.id);
                return (
                  <PermissionCheckbox
                    key={permission.id}
                    id={permission.id}
                    checked={isChecked}
                    disabled={role.isSystemRole}
                    onChange={(checked) => handleCheckboxChange(permission.id, checked)}
                    label={`${permission.resource.toUpperCase()} - ${permission.action.toUpperCase()}`}
                    description={permission.description}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
