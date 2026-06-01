'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useState, useRef, useEffect } from 'react';

const UserProfile = () => {
    const { user } = useAuth();
    const t = useTranslations('common');
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        localStorage.removeItem('atlas_token');
        router.push('/login');
    };

    const fullName = user?.employee 
        ? `${user.employee.firstName} ${user.employee.lastName}`
        : user?.email.split('@')[0] || 'Utilisateur';

    const initials = fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative animate-in fade-in duration-300" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 p-1 pr-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
                <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 shrink-0 transition-transform hover:scale-105">
                    {initials}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">{fullName}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-wider">{user?.role || 'Collaborateur'}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 shrink-0 hidden md:block" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Connecté en tant que</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    
                    <button 
                        onClick={() => { router.push('/settings'); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        <Settings size={16} className="text-slate-400" />
                        {t('settings') || 'Paramètres'}
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-550 hover:bg-red-50 rounded-xl transition-colors mt-1"
                    >
                        <LogOut size={16} />
                        {t('logout') || 'Se déconnecter'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
