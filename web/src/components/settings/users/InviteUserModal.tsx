'use client';

import React, { useState } from 'react';
import { Mail, Shield, Check, X, Send } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
}

interface InviteUserModalProps {
  roles: Role[];
  onClose: () => void;
  onInvite: (email: string, roleId: string) => Promise<void>;
}

export default function InviteUserModal({ roles, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !roleId) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await onInvite(email, roleId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Inviter un utilisateur</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Nouveau compte collaborateur</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all font-bold text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle Principal</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setRoleId(role.id)}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    roleId === role.id
                      ? 'bg-blue-50 border-blue-600 shadow-sm shadow-blue-50'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      roleId === role.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Shield size={16} />
                    </div>
                    <span className="font-black text-slate-900 text-xs tracking-tight">{role.displayName}</span>
                  </div>
                  {roleId === role.id && <Check size={16} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !roleId}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all shadow-xl shadow-blue-100 uppercase tracking-widest mt-4"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={18} />
                Envoyer l'invitation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
