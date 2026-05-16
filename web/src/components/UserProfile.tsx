'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { LogOut, User as UserIcon, Settings, Shield } from 'lucide-react';
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
        : user?.email.split('@')[0] || 'User';

    const initials = fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

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
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
                <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-sm font-bold text-slate-800 leading-none">{fullName}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{user?.role || 'User'}</p>
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Logged in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    
                    <button 
                        onClick={() => { router.push('/settings'); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        <Settings size={16} className="text-slate-400" />
                        {t('settings') || 'Settings'}
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-1"
                    >
                        <LogOut size={16} />
                        {t('logout')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
