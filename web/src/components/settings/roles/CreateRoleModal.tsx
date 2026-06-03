'use client';

import React, { useState } from 'react';
import { Shield, Check, X, Plus } from 'lucide-react';
import { AppPermission } from './RolesList';
import PermissionCheckbox from './PermissionCheckbox';

interface CreateRoleModalProps {
  allPermissions: AppPermission[];
  onClose: () => void;
  onCreate: (roleData: { name: string; displayName: string; description: string; permissionIds: string[] }) => Promise<void>;
}

export default function CreateRoleModal({
  allPermissions,
  onClose,
  onCreate
}: CreateRoleModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckboxChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, permissionId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName) {
      setError('Le nom du rôle est requis');
      return;
    }

    setLoading(true);
    try {
      // Derive name e.g. "Commercial Dept" -> "COMMERCIAL_DEPT"
      const name = displayName.trim().toUpperCase().replace(/\s+/g, '_');
      await onCreate({ name, displayName, description, permissionIds: selectedIds });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création');
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <Shield className="text-blue-600" size={22} />
              Créer un nouveau rôle
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Créez un profil d'habilitations personnalisé</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom d'affichage</label>
              <input
                type="text"
                required
                placeholder="Ex: Commercial Senior"
                className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all font-bold text-sm"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <input
                type="text"
                placeholder="Ex: Accès complet aux clients et rapports de vente"
                className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all font-bold text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Associer des permissions</h4>

            <div className="space-y-8">
              {Object.keys(groupedPermissions).map((moduleKey) => (
                <div key={moduleKey} className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-blue-600">
                    {getModuleTitle(moduleKey)}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedPermissions[moduleKey].map((permission) => {
                      const isChecked = selectedIds.includes(permission.id);
                      return (
                        <PermissionCheckbox
                          key={permission.id}
                          id={permission.id}
                          checked={isChecked}
                          disabled={false}
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
        </form>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 transition-all shadow-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !displayName}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus size={16} />
                Créer le rôle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
