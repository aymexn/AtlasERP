'use client';

import { useTranslations } from 'next-intl';
import { User, LogOut, Bell, Search } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const Topbar = () => {
    const t = useTranslations('common');
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
        <header className="bg-card border-b border-border h-20 sticky top-0 z-20 px-8 flex items-center justify-between transition-colors">
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-3 bg-muted border border-border px-4 py-2.5 rounded-2xl w-96 group focus-within:border-primary/50 focus-within:bg-card transition-all shadow-sm">
                <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    className="bg-transparent border-none outline-none text-sm font-medium w-full text-foreground placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 pr-6 border-r border-border ml-auto">
                    <button className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-danger rounded-full border-2 border-card"></span>
                    </button>
                </div>

                {/* Tenant & User Info */}
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('active_tenant')}</div>
                        <div className="text-sm font-black text-foreground tracking-tight">{tenantName || t('loading')}</div>
                    </div>

                    <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group relative">
                        <User size={20} className="group-hover:text-primary transition-colors" />

                        {/* Simple Dropdown simulation or just hover effect */}
                        <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-danger hover:bg-danger/5 rounded-xl transition-colors"
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

