'use client';

import { useEffect } from 'react';

export function HydrationGuard() {
    useEffect(() => {
        const forbiddenAttrs = [
            'data-gr-ext-installed', 
            'data-new-gr-c-s-check-loaded', 
            'cz-shortcut-listen', 
            'screen_capture_injected',
            'data-clean-hydration',
            'bis_skin_checked'
        ];

        // Detect attributes added by extensions and remove them
        const removeExtensionAttributes = (node: HTMLElement) => {
            if (!node || !node.removeAttribute) return;
            forbiddenAttrs.forEach((attr) => {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    node.removeAttribute(attr);
                }
            });
        };

        const cleanAll = () => {
            removeExtensionAttributes(document.documentElement);
            if (document.body) {
                removeExtensionAttributes(document.body);
            }
            document.querySelectorAll('[bis_skin_checked]').forEach((el) => {
                el.removeAttribute('bis_skin_checked');
            });
        };

        // Run initially
        cleanAll();

        // Observe future mutations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    const target = mutation.target as HTMLElement;
                    removeExtensionAttributes(target);
                    if (target.querySelectorAll) {
                        target.querySelectorAll('[bis_skin_checked]').forEach((el) => {
                            el.removeAttribute('bis_skin_checked');
                        });
                    }
                } else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        const el = node as HTMLElement;
                        if (el.querySelectorAll) {
                            removeExtensionAttributes(el);
                            el.querySelectorAll('[bis_skin_checked]').forEach((child) => {
                                child.removeAttribute('bis_skin_checked');
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.documentElement, { 
            attributes: true, 
            childList: true, 
            subtree: true 
        });
        return () => observer.disconnect();
    }, []);

    return null;
}
