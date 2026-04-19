'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Grand Bleu Restoration: Lock to Light Mode
    const [theme] = useState<Theme>('light');

    useEffect(() => {
        // Force light mode on mount
        document.documentElement.classList.remove('dark');
        localStorage.setItem('atlas-theme', 'light');
    }, []);

    const toggleTheme = () => {
        // No-op to prevent regression if called
        console.warn('Grand Bleu Restoration: Theme switching is disabled.');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

