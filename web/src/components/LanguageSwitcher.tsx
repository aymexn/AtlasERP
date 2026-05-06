'use client';

import { usePathname, useRouter } from '@/navigation';
import { useLocale } from 'next-intl';

const LanguageSwitcher = () => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLanguage = (newLocale: string) => {
        // router.replace in next-intl handles the locale prefix automatically
        // when using the localized router from '@/navigation'
        router.replace(pathname as any, { locale: newLocale });
    };

    const languages = [
        { code: 'fr', name: 'FR', flag: '🇫🇷' },
        { code: 'ar', name: 'AR', flag: '🇸🇦' },
        { code: 'en', name: 'EN', flag: '🇺🇸' },
    ];

    return (
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200" suppressHydrationWarning>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => switchLanguage(lang.code)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all
                        ${locale === lang.code
                            ? 'bg-white text-primary shadow-sm transform scale-105'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}
                    `}
                >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;

