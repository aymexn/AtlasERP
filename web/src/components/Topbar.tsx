'use client';

import { useTranslations } from 'next-intl';
import { Bell, Search, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import UserProfile from './UserProfile';
import LanguageSwitcher from './LanguageSwitcher';

const Topbar = () => {
    const t = useTranslations('common');
    const [tenantName, setTenantName] = useState('');

    useEffect(() => {
        apiFetch('/tenants/me')
            .then(data => {
                if (data && data.name) {
                    setTenantName(data.name);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all shadow-sm">
            {/* Left Section: Mobile Menu & Search */}
            <div className="flex items-center gap-4 flex-1">
                <button className="md:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500">
                    <Menu size={20} />
                </button>
                
                <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-80 group focus-within:border-blue-200 focus-within:bg-white transition-all focus-within:shadow-sm">
                    <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Center Section: Active Tenant (Optional/Subtle) */}
            <div className="hidden lg:flex flex-col items-center flex-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('active_tenant')}</p>
                <p className="text-sm font-bold text-slate-600 tracking-tight">{tenantName || '...'}</p>
            </div>

            {/* Right Section: Actions, Language, Profile */}
            <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end">
                {/* Language Switcher */}
                <div className="hidden sm:block">
                    <LanguageSwitcher />
                </div>

                {/* Notifications */}
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
                </button>

                {/* Divider */}
                <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block"></div>

                {/* User Profile */}
                <UserProfile />
            </div>
        </header>
    );
};

export default Topbar;

