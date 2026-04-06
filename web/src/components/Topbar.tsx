'use client';

import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { User, LogOut, Bell, Search } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const Topbar = () => {
    const t = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const [tenantName, setTenantName] = useState('');

    useEffect(() => {
        apiFetch('/tenants/me')
            .then(data => {
                if (data && data.name) {
                    setTenantName(data.name);
                }
            })
            .catch(() => {
                // Silently fail, AuthWrapper will handle redirects if needed
            });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('atlas_token');
        router.push('/login');
    };

    return (
        <header className="bg-white border-b border-gray-100 h-20 sticky top-0 z-20 px-8 flex items-center justify-between">
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl w-96 group focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
                <Search size={18} className="text-gray-400 group-focus-within:text-blue-500" />
                <input
                    type="text"
                    placeholder="Search anything..."
                    className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-700 placeholder:text-gray-400"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 pr-6 border-r border-gray-100 ml-auto">
                    <LanguageSwitcher />
                    <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>

                {/* Tenant & User Info */}
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('active_tenant')}</p>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{tenantName || t('loading')}</p>
                    </div>

                    <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group relative">
                        <User size={20} className="group-hover:text-blue-600" />

                        {/* Simple Dropdown simulation or just hover effect */}
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <LogOut size={16} />
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
