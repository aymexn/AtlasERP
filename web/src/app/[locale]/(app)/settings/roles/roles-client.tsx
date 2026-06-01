'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Shield, 
  Settings, 
  Users, 
  ChevronRight, 
  Check, 
  Plus, 
  Search,
  Lock,
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
  const t = useTranslations('admin.roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Role Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        apiFetch('/api/roles'),
        apiFetch('/api/permissions')
      ]);
      setRoles(rolesData || []);
      setPermissions(permsData || []);
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
      toast.error('Error loading RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = (role: Role) => {
    setSelectedRole(role);
    if (role.name === 'ADMIN') {
      setRolePermissions(permissions.map(p => p.id));
    } else {
      setRolePermissions(role.permissions.map(p => p.permission.id));
    }
  };

  const togglePermission = async (permissionId: string) => {
    if (!selectedRole || selectedRole.name === 'ADMIN' || selectedRole.isSystemRole) {
      return;
    }

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
        await apiFetch(`/api/roles/${selectedRole.id}/permissions/${permissionId}`, {
          method: 'DELETE',
        });
        toast.success('Permission supprimée');
      } else {
        // Add permission
        await apiFetch(`/api/roles/${selectedRole.id}/permissions`, {
          method: 'POST',
          body: JSON.stringify({ permissionIds: permissionId }),
        });
        toast.success('Permission ajoutée');
      }
      
      // Update the local roles state to keep everything in sync
      setRoles(prev => prev.map(r => {
        if (r.id === selectedRole.id) {
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

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !newRoleDisplayName) {
      toast.error('Nom et nom d\'affichage requis');
      return;
    }
    setCreatingRole(true);
    try {
      const result = await apiFetch('/api/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: newRoleName,
          displayName: newRoleDisplayName,
          description: newRoleDescription
        })
      });
      toast.success('Rôle créé avec succès');
      setRoles(prev => [...prev, result]);
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Erreur lors de la création du rôle');
    } finally {
      setCreatingRole(false);
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
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard module="roles" resource="role" action="read" showLoading>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t('title')}</h1>
            <p className="text-slate-500 text-sm font-medium">{t('subtitle')}</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-2 font-black text-sm transition-all shadow-lg shadow-blue-100 uppercase tracking-tighter"
          >
            <Plus size={18} />
            {t('create')}
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
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{role.description || 'Sans description'}</div>
                      </div>
                    </div>
                    {role.name === 'ADMIN' && (
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
                        <span className={`h-1.5 w-1.5 rounded-full ${(selectedRole.name === 'ADMIN' || selectedRole.isSystemRole) ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {(selectedRole.name === 'ADMIN' || selectedRole.isSystemRole) ? 'Rôle Système (Lecture Seule)' : 'Rôle Personnalisé'}
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
                          {perms.map((perm) => {
                            const isDisabled = selectedRole.name === 'ADMIN' || selectedRole.isSystemRole;
                            const isChecked = rolePermissions.includes(perm.id);
                            return (
                              <button
                                key={perm.id}
                                disabled={isDisabled}
                                onClick={() => togglePermission(perm.id)}
                                className={`group text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                                  isDisabled ? 'opacity-65 cursor-not-allowed border-transparent' : 'cursor-pointer'
                                } ${
                                  isChecked
                                    ? 'bg-blue-50/50 border-blue-600 shadow-sm shadow-blue-50'
                                    : 'bg-slate-50/50 border-transparent hover:border-slate-200'
                                }`}
                              >
                                <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border-2 border-slate-200 group-hover:border-slate-300'
                                }`}>
                                  {isChecked && <Check size={12} />}
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{perm.resource} - {perm.action}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 leading-relaxed">{perm.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Créer un Rôle */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Créer un Rôle</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Nouveau profil d'accès système</p>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Code du Rôle (Unique, Majuscules)</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. COMPTABLE"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-55 border-2 border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom d'affichage</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Comptable Senior"
                    value={newRoleDisplayName}
                    onChange={(e) => setNewRoleDisplayName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-55 border-2 border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                  <textarea
                    placeholder="Description du rôle..."
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="w-full h-20 p-4 bg-slate-55 border-2 border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-inner resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="h-11 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingRole}
                    className="h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                    {creatingRole && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white animate-fast"></div>}
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

