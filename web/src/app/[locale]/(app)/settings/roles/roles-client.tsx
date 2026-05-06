'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Shield, 
  Settings, 
  Users, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Plus, 
  Save, 
  Trash2,
  Search,
  Lock,
  Globe,
  Layout,
  Database,
  Briefcase,
  ShoppingCart,
  Truck,
  PieChart
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: { permission: Permission }[];
}

export default function RolesClient() {
  const t = useTranslations('settings');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        apiFetch('/rbac/roles'),
        apiFetch('/rbac/permissions') // I need to add this endpoint to backend
      ]);
      setRoles(rolesData || []);
      setPermissions(permsData || []);
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
      toast.error('Erreur lors du chargement des données RBAC');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(role.permissions.map(p => p.permission.id));
  };

  const togglePermission = async (permissionId: string) => {
    const isAssigned = rolePermissions.includes(permissionId);
    
    // Optimistic UI update
    setRolePermissions(prev => 
      isAssigned 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );

    try {
      if (isAssigned) {
        // Remove permission
        await apiFetch(`/rbac/roles/${selectedRole?.id}/permissions/${permissionId}`, {
          method: 'DELETE',
        });
        toast.success('Permission retirée');
      } else {
        // Add permission
        await apiFetch(`/rbac/roles/${selectedRole?.id}/permissions`, {
          method: 'POST',
          body: JSON.stringify({ permissionIds: permissionId }),
        });
        toast.success('Permission ajoutée');
      }
      
      // Update the local roles state to keep everything in sync
      setRoles(prev => prev.map(r => {
        if (r.id === selectedRole?.id) {
          const newPerms = isAssigned 
            ? r.permissions.filter(p => p.permission.id !== permissionId)
            : [...r.permissions, { permission: permissions.find(p => p.id === permissionId)! }];
          return { ...r, permissions: newPerms };
        }
        return r;
      }));
    } catch (error) {
      // Revert on error
      setRolePermissions(prev => 
        isAssigned 
          ? [...prev, permissionId]
          : prev.filter(id => id !== permissionId)
      );
      toast.error('Erreur lors de la mise à jour de la permission');
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const moduleIcons: Record<string, any> = {
    clients: Users,
    suppliers: Truck,
    products: Layout,
    stock: Database,
    sales: ShoppingCart,
    purchases: ShoppingCart,
    finance: PieChart,
    hr: Briefcase,
    reports: PieChart,
    settings: Settings,
    users: Users,
    roles: Shield,
    audit: Lock
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard module="roles" resource="role" action="read" showLoading>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Gestion des Rôles & Sécurité</h1>
            <p className="text-slate-500 text-sm font-medium">Définissez les niveaux d'accès et les permissions granulaires par profil.</p>
          </div>
          <button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-2 font-black text-sm transition-all shadow-lg shadow-blue-100 uppercase tracking-tighter">
            <Plus size={18} />
            Nouveau Rôle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Roles List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un rôle..."
                className="w-full h-12 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Profils Disponibles</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {roles.filter(r => r.displayName.toLowerCase().includes(searchTerm.toLowerCase())).map((role) => (
                  <button
                    key={role.id}
                    onClick={() => loadRolePermissions(role)}
                    className={`w-full text-left p-6 transition-all group flex items-center justify-between ${
                      selectedRole?.id === role.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        selectedRole?.id === role.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                      }`}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight">{role.displayName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{role.description || 'Pas de description'}</div>
                      </div>
                    </div>
                    {role.isSystemRole && (
                      <Lock size={14} className="text-slate-300" />
                    )}
                    <ChevronRight size={18} className={`transition-all ${selectedRole?.id === role.id ? 'text-blue-600 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-8">
            {!selectedRole ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Shield size={32} />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tighter">Sélectionnez un rôle</p>
                  <p className="text-slate-400 text-sm font-bold">Choisissez un profil à gauche pour configurer ses accès.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedRole.displayName}</h2>
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedRole.isSystemRole ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {selectedRole.isSystemRole ? 'Rôle Système (Edition Autorisée)' : 'Rôle Personnalisé'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const Icon = moduleIcons[module] || Layout;
                    return (
                      <div key={module} className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                            <Icon size={16} />
                          </div>
                          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{module}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {perms.map((perm) => (
                            <button
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`group text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                                rolePermissions.includes(perm.id)
                                  ? 'bg-blue-50/50 border-blue-600 shadow-sm shadow-blue-50'
                                  : 'bg-slate-50/50 border-transparent hover:border-slate-200'
                              }`}
                            >
                              <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-all ${
                                rolePermissions.includes(perm.id)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border-2 border-slate-200 group-hover:border-slate-300'
                              }`}>
                                {rolePermissions.includes(perm.id) && <Check size={12} />}
                              </div>
                              <div>
                                <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{perm.resource} - {perm.action}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 leading-relaxed">{perm.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
