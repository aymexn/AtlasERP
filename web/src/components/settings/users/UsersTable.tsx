import React, { useState } from 'react';
import { Mail, Shield, MoreVertical, UserX, UserCheck, Eye, Trash2, Ban } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';

export interface AppRole {
  id: string;
  name: string;
  displayName: string;
}

export interface User {
  id: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  roles: { role: AppRole }[];
  createdAt: string;
}

interface UsersTableProps {
  users: User[];
  searchTerm: string;
  onEditRole: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  onSuspend: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UsersTable({
  users,
  searchTerm,
  onEditRole,
  onActivate,
  onDeactivate,
  onSuspend,
  onDelete
}: UsersTableProps) {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const locale = useLocale();
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to color avatar background based on email length/char
  const getAvatarBg = (email: string) => {
    const colors = [
      'bg-blue-50 text-blue-600',
      'bg-indigo-50 text-indigo-600',
      'bg-violet-50 text-violet-600',
      'bg-purple-50 text-purple-600',
      'bg-fuchsia-50 text-fuchsia-600'
    ];
    const index = email.length % colors.length;
    return colors[index];
  };

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
      case 'ADMINISTRATOR':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'COMMERCIAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ACCOUNTANT':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getRoleDisplayName = (displayName: string, loc: string) => {
    const name = displayName.toUpperCase();
    if (loc === 'en') {
      if (name.includes('ADMIN')) return 'Administrator';
      if (name.includes('COLLABORATEUR') || name.includes('USER')) return 'Collaborator';
      if (name.includes('COMMERCIAL') || name.includes('VENTE')) return 'Commercial/Sales';
      if (name.includes('COMPTABLE') || name.includes('ACCOUNTANT')) return 'Accountant';
      if (name.includes('MAGASINIER')) return 'Warehouse Manager';
    } else if (loc === 'ar') {
      if (name.includes('ADMIN')) return 'مسؤول';
      if (name.includes('COLLABORATEUR') || name.includes('USER')) return 'متعاون';
      if (name.includes('COMMERCIAL') || name.includes('VENTE')) return 'تجاري / مبيعات';
      if (name.includes('COMPTABLE') || name.includes('ACCOUNTANT')) return 'محاسب';
      if (name.includes('MAGASINIER')) return 'أمين مخزن';
    }
    return displayName;
  };

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t('table.user')}
            </th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t('table.roles')}
            </th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t('table.status')}
            </th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
              {t('table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-12 text-slate-400 font-bold text-sm">
                {locale === 'ar' ? 'لم يتم العثور على مستخدمين' : locale === 'en' ? 'No users found' : 'Aucun utilisateur trouvé'}
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase ${getAvatarBg(user.email)}`}>
                      {user.email.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-black text-slate-950 text-sm tracking-tight">{user.email}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail size={10} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400">
                          {getRoleDisplayName(user.roles[0]?.role.displayName ?? 'Collaborateur', locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-wrap gap-2 items-center">
                    {user.roles.map(ur => (
                      <button
                        key={ur.role.id}
                        onClick={() => router.push(`/settings/roles?selected=${ur.role.id}` as any)}
                        className={`group flex items-center gap-1.5 px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all hover:scale-105 ${getRoleBadgeStyle(ur.role.name)}`}
                        title="Voir le rôle et ses permissions"
                      >
                        <Shield size={10} />
                        {getRoleDisplayName(ur.role.displayName, locale)}
                      </button>
                    ))}
                    <button
                      onClick={() => onEditRole(user)}
                      className="px-3 py-1 border border-dashed border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
                    >
                      {locale === 'ar' ? '+ إضافة' : locale === 'en' ? '+ ADD' : '+ AJOUTER'}
                    </button>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      user.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
                      user.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {user.status === 'ACTIVE' ? (locale === 'ar' ? 'نشط' : locale === 'en' ? 'Active' : 'Accepté') :
                       user.status === 'PENDING' ? (locale === 'ar' ? 'قيد الانتظار' : locale === 'en' ? 'Pending' : 'En attente') : 
                       (locale === 'ar' ? 'معلق' : locale === 'en' ? 'Suspended' : 'Suspendu')}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right relative overflow-visible">
                  <button
                    onClick={() => setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeMenuUserId === user.id && (
                    <div className="absolute right-8 top-12 z-50 w-56 bg-white border-2 border-slate-100 rounded-2xl shadow-xl py-2 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => {
                          onEditRole(user);
                          setActiveMenuUserId(null);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-tighter"
                      >
                        <Shield size={14} className="text-slate-400" />
                        {locale === 'ar' ? 'إدارة الأدوار' : locale === 'en' ? 'Manage roles' : 'Gérer les rôles'}
                      </button>

                      <button
                        onClick={() => {
                          router.push(`/settings/audit-logs?userId=${user.id}` as any);
                          setActiveMenuUserId(null);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-tighter"
                      >
                        <Eye size={14} className="text-slate-400" />
                        {locale === 'ar' ? 'عرض النشاط' : locale === 'en' ? 'View activity' : 'Voir activité'}
                      </button>

                      {user.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => {
                            onActivate(user);
                            setActiveMenuUserId(null);
                          }}
                          className="w-full px-4 py-2.5 hover:bg-green-50 hover:text-green-700 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-tighter"
                        >
                          <UserCheck size={14} className="text-green-500" />
                          {locale === 'ar' ? 'تنشيط' : locale === 'en' ? 'Activate' : 'Activer'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onDeactivate(user);
                              setActiveMenuUserId(null);
                            }}
                            className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-tighter"
                          >
                            <UserX size={14} className="text-slate-400" />
                            {locale === 'ar' ? 'إلغاء التنشيط' : locale === 'en' ? 'Deactivate' : 'Désactiver'}
                          </button>
                          <button
                            onClick={() => {
                              onSuspend(user);
                              setActiveMenuUserId(null);
                            }}
                            className="w-full px-4 py-2.5 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-tighter"
                          >
                            <Ban size={14} className="text-amber-500" />
                            {locale === 'ar' ? 'تعليق' : locale === 'en' ? 'Suspend' : 'Suspendre'}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          onDelete(user);
                          setActiveMenuUserId(null);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-tighter border-t border-slate-100"
                      >
                        <Trash2 size={14} className="text-red-500" />
                        {locale === 'ar' ? 'حذف' : locale === 'en' ? 'Delete' : 'Supprimer'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
