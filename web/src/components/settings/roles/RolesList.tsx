'use client';

import React from 'react';
import { Shield, ChevronRight, Plus } from 'lucide-react';

export interface AppPermission {
  id: string;
  module: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: AppPermission;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: RolePermission[];
}

interface RolesListProps {
  roles: Role[];
  selectedRoleId: string | null;
  onSelect: (roleId: string) => void;
  onCreateClick: () => void;
}

export default function RolesList({
  roles,
  selectedRoleId,
  onSelect,
  onCreateClick
}: RolesListProps) {
  // Helper to color shield icon based on role type
  const getShieldColor = (name: string, isSystem: boolean) => {
    if (name.toUpperCase() === 'ADMIN' || name.toUpperCase() === 'ADMINISTRATOR') return 'text-red-600 bg-red-50 border-red-100';
    if (isSystem) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-purple-600 bg-purple-50 border-purple-100';
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
      <div className="p-6 border-b border-slate-50 bg-slate-50/20">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Profils Disponibles</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {roles.map((role) => {
          const isSelected = selectedRoleId === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onSelect(role.id)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between group transition-all text-left ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-600 shadow-sm shadow-blue-50'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${getShieldColor(role.name, role.isSystemRole)}`}>
                  <Shield size={18} />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-sm tracking-tight">{role.displayName}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">
                    {role.description || (role.isSystemRole ? 'ROLE SYSTEME' : 'ROLE PERSONNALISE')}
                  </div>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-all ${
                  isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-50 bg-slate-50/20">
        <button
          onClick={onCreateClick}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-lg shadow-blue-100 uppercase tracking-tighter"
        >
          <Plus size={16} />
          Créer un Rôle
        </button>
      </div>
    </div>
  );
}
