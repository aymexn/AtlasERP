'use client';

import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    if (!mounted) return <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100" />;

    return (
        <button
            onClick={toggleTheme}
            className="h-10 w-10 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary dark:hover:text-primary transition-all shadow-sm group"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        >
            {theme === 'light' ? (
                <Moon size={20} className="group-hover:rotate-12 transition-transform" />
            ) : (
                <Sun size={20} className="group-hover:rotate-90 transition-transform" />
            )}
        </button>
    );
}

