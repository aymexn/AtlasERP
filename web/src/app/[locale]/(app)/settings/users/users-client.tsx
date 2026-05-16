'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Clock, 
  MoreVertical, 
  ChevronRight,
  Search,
  Check,
  X,
  AlertCircle,
  Plus,
  Send
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

interface User {
  id: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  roles: { role: { id: string, name: string, displayName: string } }[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
}

export default function UsersClient() {
  const t = useTranslations('admin.users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/rbac/roles')
      ]);
      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Failed to load users data:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRoleId) return;
    
    setInviting(true);
    try {
      await apiFetch('/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, roleId: inviteRoleId }),
      });
      toast.success('Invitation sent successfully');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRoleId('');
      loadData();
    } catch (error) {
      toast.error('Error sending invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await apiFetch(`/rbac/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
      });
      toast.success('Role assigned successfully');
      loadData();
    } catch (error) {
      toast.error('Error assigning role');
    }
  };

  const handleRevokeRole = async (userId: string, roleId: string) => {
    try {
      await apiFetch(`/rbac/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
      });
      toast.success('Role revoked successfully');
      loadData();
    } catch (error) {
      toast.error('Error revoking role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard module="users" resource="user" action="read" showLoading>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t('title')}</h1>
            <p className="text-slate-500 text-sm font-medium">{t('subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-2 font-black text-sm transition-all shadow-lg shadow-blue-100 uppercase tracking-tighter"
          >
            <UserPlus size={18} />
            {t('invite')}
          </button>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-4xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={t('search')}
                className="w-full h-11 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                {t('count', { count: users.length })}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.user')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.roles')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.status')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                          {user.email.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm tracking-tight">{user.email}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail size={10} className="text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400">Collaborator</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map(ur => (
                          <div key={ur.role.id} className="group flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                            <Shield size={10} />
                            {ur.role.displayName}
                            <button 
                              onClick={() => handleRevokeRole(user.id, ur.role.id)}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all ml-1"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRoleModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-100 transition-all"
                        >
                          <Plus size={10} />
                          {t('role_modal.add')}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          user.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 
                          user.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-300'
                        }`}></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {user.status === 'ACTIVE' ? 'Active' : 
                           user.status === 'PENDING' ? 'Pending' : 'Suspended'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invitation Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{t('invite_modal.title')}</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{t('invite_modal.subtitle')}</p>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('invite_modal.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="email@example.com"
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all font-bold text-sm"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('invite_modal.role')}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {roles.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setInviteRoleId(role.id)}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                          inviteRoleId === role.id 
                            ? 'bg-blue-50 border-blue-600 shadow-sm shadow-blue-50' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            inviteRoleId === role.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Shield size={16} />
                          </div>
                          <span className="font-black text-slate-900 text-xs tracking-tight">{role.displayName}</span>
                        </div>
                        {inviteRoleId === role.id && <Check size={16} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={inviting || !inviteEmail || !inviteRoleId}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all shadow-xl shadow-blue-100 uppercase tracking-widest mt-4"
                >
                  {inviting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('invite_modal.send')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Role Assignment Modal */}
        {isRoleModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('role_modal.title')}</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-tighter">{selectedUser.email}</p>
                </div>
                <button onClick={() => setIsRoleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-3">
                {roles.map(role => {
                  const isAssigned = selectedUser.roles.some(ur => ur.role.id === role.id);
                  return (
                    <button
                      key={role.id}
                      disabled={isAssigned}
                      onClick={() => {
                        handleAssignRole(selectedUser.id, role.id);
                        setIsRoleModalOpen(false);
                      }}
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
                      {isAssigned ? <Check size={18} className="text-green-500" /> : <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setIsRoleModalOpen(false)}
                  className="flex-1 h-12 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
