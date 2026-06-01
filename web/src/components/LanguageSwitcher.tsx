'use client';

import { usePathname } from '@/navigation';
import { useLocale } from 'next-intl';

const LanguageSwitcher = () => {
    const locale = useLocale();
    const pathname = usePathname();

    const switchLocale = (newLocale: string) => {
        // Set cookie for next-intl detection
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        // Navigate to localized route
        window.location.href = `/${newLocale}${pathname === '/' ? '' : pathname}`;
    };

    return (
        <div className="relative group w-full">
            <select
                value={locale}
                onChange={(e) => switchLocale(e.target.value)}
                className="w-full ps-6 pe-12 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
            >
                <option value="fr">Français 🇫🇷</option>
                <option value="en">English 🇺🇸</option>
                <option value="ar">العربية 🇩🇿</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
            </div>
        </div>
    );
};

export default LanguageSwitcher;

