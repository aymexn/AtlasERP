'use client';

import { useEffect } from 'react';
import { useRouter } from '@/navigation';

export function useKeyboardShortcuts() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Meta (Cmd on Mac) or Ctrl
            const isMod = e.ctrlKey || e.metaKey;

            // Ctrl+K -> Search (Usually triggers a search modal or focuses search)
            if (isMod && e.key === 'k') {
                e.preventDefault();
                // Find any search input and focus it
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="rechercher"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                } else {
                    // Fallback: navigate to products list which has a search bar
                    router.push('/products');
                }
            }

            // Ctrl+N -> New Sale Order
            if (isMod && !e.shiftKey && e.key === 'n') {
                e.preventDefault();
                router.push('/sales/orders/new');
            }

            // Ctrl+Shift+N -> New Invoice
            if (isMod && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
                e.preventDefault();
                router.push('/finances/invoices/new');
            }

            // / -> Focus search bar
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="rechercher"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
}
