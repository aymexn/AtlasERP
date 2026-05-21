'use client';

import { useEffect } from 'react';

export function HydrationGuard() {
    useEffect(() => {
        // Detect attributes added by extensions (like Grammarly, translation tools, dark reader, etc.) and remove them
        const removeExtensionAttributes = () => {
            const el = document.documentElement;
            const forbiddenAttrs = [
                'data-gr-ext-installed', 
                'data-new-gr-c-s-check-loaded', 
                'cz-shortcut-listen', 
                'screen_capture_injected',
                'data-clean-hydration'
            ];
            forbiddenAttrs.forEach((attr) => {
                if (el.hasAttribute(attr)) {
                    el.removeAttribute(attr);
                }
            });
            if (document.body) {
                forbiddenAttrs.forEach((attr) => {
                    if (document.body.hasAttribute(attr)) {
                        document.body.removeAttribute(attr);
                    }
                });
            }
        };

        // Run initially
        removeExtensionAttributes();

        // Observe future mutations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    removeExtensionAttributes();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return null;
}
