'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from '@/navigation';
import { useLocale } from 'next-intl';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇩🇿' }
];

export default function LanguageSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeLanguage = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

    const switchLocale = async (newLocale: string) => {
        // Set cookie for next-intl detection
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        
        try {
            await fetch('/api/settings/locale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locale: newLocale })
            });
        } catch (e) {
            // Ignore error if not logged in
        }

        // Navigate to localized route (forcing refresh to apply RTL/LTR on server)
        window.location.href = `/${newLocale}${pathname === '/' ? '' : pathname}`;
        setIsOpen(false);
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // RTL adjustment: when locale is Arabic, we shift text alignment and placement
    const isRtl = locale === 'ar';

    return (
        <div className="relative inline-block text-left" ref={dropdownRef} suppressHydrationWarning>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-slate-200/60 hover:border-blue-500/50 hover:shadow-xs transition-all duration-200 rounded-full text-xs font-semibold text-slate-700 cursor-pointer backdrop-blur-md"
            >
                <span className="text-sm line-height-none leading-none">{activeLanguage.flag}</span>
                <span className={`${isRtl ? 'font-sans' : 'font-medium'}`}>{activeLanguage.name}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div 
                    className={`absolute mt-2 w-36 origin-top-right rounded-xl bg-white shadow-xl border border-slate-100 ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden ${
                        isRtl ? 'left-0 right-auto' : 'right-0 left-auto'
                    }`}
                >
                    <div className="py-1">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => switchLocale(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-slate-50 hover:text-blue-600 ${
                                    locale === lang.code ? 'bg-slate-50/80 text-blue-600 font-bold' : 'text-slate-700 font-medium'
                                } ${isRtl ? 'text-right justify-start flex-row-reverse' : 'text-left justify-start'}`}
                            >
                                <span className="text-sm leading-none">{lang.flag}</span>
                                <span>{lang.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
