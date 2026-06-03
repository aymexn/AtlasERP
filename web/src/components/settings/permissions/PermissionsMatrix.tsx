'use client';

import React, { useState } from 'react';
import { Search, Shield, Lock, Check, X } from 'lucide-react';
import { Role, AppPermission } from '../roles/RolesList';
import { useRouter } from '@/navigation';

interface PermissionsMatrixProps {
  roles: Role[];
  permissions: AppPermission[];
  onTogglePermission: (roleId: string, permissionId: string, checked: boolean) => Promise<void>;
}

export default function PermissionsMatrix({
  roles,
  permissions,
  onTogglePermission
}: PermissionsMatrixProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');

  // Extract unique modules list
  const modules = Array.from(new Set(permissions.map(p => p.module.toUpperCase())));

  // Filter permissions
  const filteredPermissions = permissions.filter(p => {
    const matchesSearch = `${p.resource}:${p.action}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === '' || p.module.toUpperCase() === selectedModule;
    return matchesSearch && matchesModule;
  });

  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'AUDIT': return 'AUDIT';
      case 'CLIENTS': return 'CLIENTS';
      case 'PRODUCTS': return 'CATALOGUE';
      case 'STOCK': return 'STOCK';
      case 'SALES': return 'COMMANDES (VENTES)';
      case 'PURCHASES': return 'APPROVISIONNEMENTS';
      case 'FINANCE': return 'FINANCE';
      case 'HR': return 'RESSOURCES HUMAINES';
      case 'REPORTS': return 'RAPPORTS';
      case 'SETTINGS': return 'PARAMÈTRES';
      case 'USERS': return 'UTILISATEURS';
      case 'ROLES': return 'RÔLES';
      default: return mod;
    }
  };

  const handleCellClick = async (role: Role, permissionId: string, currentChecked: boolean) => {
    if (role.isSystemRole) return; // Read-only
    await onTogglePermission(role.id, permissionId, !currentChecked);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une permission..."
            className="w-full h-11 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all font-bold text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="h-11 px-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none font-bold text-xs text-slate-700 transition-all"
          >
            <option value="">Tous les Modules</option>
            {modules.map(mod => (
              <option key={mod} value={mod}>{getModuleTitle(mod)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left min-w-[280px]">
                  Permissions / Droits
                </th>
                {roles.map(role => (
                  <th
                    key={role.id}
                    className="px-6 py-5 min-w-[150px]"
                  >
                    <button
                      onClick={() => router.push(`/settings/roles?selected=${role.id}` as any)}
                      className="group flex flex-col items-center gap-1 mx-auto"
                    >
                      <span className="text-xs font-black text-slate-900 tracking-tight group-hover:text-blue-600 group-hover:underline flex items-center gap-1 justify-center">
                        {role.displayName}
                        {role.isSystemRole && <Lock size={10} className="text-slate-400" />}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest group-hover:text-blue-500">
                        {role.isSystemRole ? 'Système' : 'Custom'}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 tracking-tight">
                        {perm.resource.toUpperCase()} - {perm.action.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                        {getModuleTitle(perm.module)} {perm.description ? `• ${perm.description}` : ''}
                      </span>
                    </div>
                  </td>
                  {roles.map(role => {
                    const isChecked = role.permissions.some(rp => rp.permissionId === perm.id);
                    return (
                      <td
                        key={role.id}
                        className="px-6 py-4 text-center"
                      >
                        <button
                          type="button"
                          disabled={role.isSystemRole}
                          onClick={() => handleCellClick(role, perm.id, isChecked)}
                          className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center border transition-all ${
                            isChecked
                              ? role.isSystemRole
                                ? 'bg-slate-100 border-slate-200 text-slate-500'
                                : 'bg-blue-65 bg-blue-50 border-blue-200 text-blue-600 shadow-sm shadow-blue-50 hover:bg-blue-100'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-300'
                          } ${role.isSystemRole ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                        >
                          {isChecked ? (
                            <Check size={14} className="stroke-[3]" />
                          ) : (
                            <X size={12} className="stroke-[2] text-slate-200" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
