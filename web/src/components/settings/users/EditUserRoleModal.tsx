'use client';

import React, { useState } from 'react';
import { Shield, Check, X, ChevronRight } from 'lucide-react';
import { User, AppRole } from './UsersTable';

interface EditUserRoleModalProps {
  user: User;
  roles: AppRole[];
  onClose: () => void;
  onUpdateRole: (userId: string, roleId: string) => Promise<void>;
}

export default function EditUserRoleModal({
  user,
  roles,
  onClose,
  onUpdateRole
}: EditUserRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectRole = async (roleId: string) => {
    setLoading(true);
    setError('');
    try {
      await onUpdateRole(user.id, roleId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'attribution du rôle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Assigner un Rôle</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 tracking-tight lowercase">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-3 max-h-[24rem] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold mb-3">
              {error}
            </div>
          )}

          {roles.map((role) => {
            const isAssigned = user.roles.some(ur => ur.role.id === role.id);
            return (
              <button
                key={role.id}
                disabled={isAssigned || loading}
                onClick={() => handleSelectRole(role.id)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between group transition-all ${
                  isAssigned
                    ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                    : 'bg-white border-slate-100 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isAssigned ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Shield size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-slate-900 text-sm tracking-tight">{role.displayName}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role.name}</div>
                  </div>
                </div>
                {isAssigned ? (
                  <Check size={18} className="text-green-500" />
                ) : (
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
